import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { ColumnMode, DatatableComponent } from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { finalize, takeUntil } from "rxjs/operators";
import { CoreConfigService } from "@core/services/config.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { BranchService } from "../branch/branch.service";
import { ToastrService } from "ngx-toastr";
import { DepartmentService } from "./department.service";
import { ValidationPatterns } from "common/validation-patterns";

@Component({
  selector: "app-department-list",
  templateUrl: "./department.component.html",
  styleUrls: ["./department.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class DepartmentComponent implements OnInit {
  // Public
  public rows;
  public ColumnMode = ColumnMode;
  public cols: any[];
  public deleteLoading: boolean = false;
  public branches: any = { id: 0, branchName: '+ Thêm mới chi nhánh' };
  public departments: any;
  public modalRef: any;
  public filteredDepartments = [];
  public deleteIds = [];
  public formLoading: boolean = false;

  public modalMode: "add" | "edit" | "view" = "add";
  public selectedDepartment: any = null;
  departmentFields: Array<{ label: string; value: string | null }> = [];

  public selectBranch: any = null;

  public selectedBranch: any = null;
  // Decorator
  @ViewChild(DatatableComponent) table: DatatableComponent;
  public modalLoading: boolean = false;
  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;

  private form: any;
  public loading: boolean = false;

  constructor(
    private _departmentService: DepartmentService,
    private _branchService: BranchService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.form = this.fb.group({
      departmentName: [
        "",
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(255),
        ],
      ],
      branchId: [
        null,
        [
          Validators.required,
          Validators.pattern("^[0-9]+$"),
          Validators.minLength(1),
          Validators.maxLength(10),
        ],
      ],
      parentDepartmentId: [
        { value: null, disabled: true },
        [
          Validators.minLength(1),
          Validators.maxLength(10),
          Validators.pattern("^[0-9]+$"),
        ],
      ],
    });
  }

  onBranchAdded(newBranch: any): void {
    this.form.get('branchId').setValue(newBranch.id);
  }

  onBranchBlur(): void {
    const branchControl = this.form.get('branchId');
    if (!branchControl?.value) {
      branchControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  displayApiErrors(formGroup: FormGroup, apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (formGroup.controls[err.field]) {
        formGroup.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  onDepartmentCloseModal(modal: any): void {
    this.form.reset(); // Reset toàn bộ branchForm
    modal.dismiss("Cross click"); // Đóng modal
  }

  onSubmitReactiveForm(modal): void {
    this.formLoading = true;

    if (this.form.valid) {
      const departmentData = this.form.value;

      if (this.modalMode === "add") {
        this._departmentService.createDepartment(departmentData)
          .pipe(
            finalize(() => {
              this.formLoading = false; // Đảm bảo được gọi khi API hoàn tất
            })
          )
          .subscribe(
            (response) => {
              if (response.code === 201) {
                this.toastr.success("Thêm phòng ban thành công", "Thành công");
                modal.close();
                this.form.reset();
                this.modalRef.close();
                this.loadParentDepartments();
              } else {
                this.displayApiErrors(this.form, response.message);
              }
            },
            (error) => {
              console.error("Có lỗi xảy ra khi thêm phòng ban", error);
            }
          );
      } else if (this.modalMode === "edit") {
        this._departmentService.updateDepartment(this.selectedDepartment.id, departmentData)
          .pipe(
            finalize(() => {
              this.formLoading = false; // Đảm bảo được gọi khi API hoàn tất
            })
          )
          .subscribe(
            (response) => {
              if (response.code === 200) {
                this.toastr.success("Cập nhật phòng ban thành công", "Thành công");
                modal.close();
                this.loadParentDepartments();
                this.form.reset();
              } else {
                this.displayApiErrors(this.form, response.message);
              }
            },
            (error) => {
              console.error("Có lỗi xảy ra khi cập nhật phòng ban", error);
            }
          );
      }
    } else {
      this.formLoading = false; // Trường hợp form không hợp lệ
    }
  }



  get DepartmentName() {
    return this.form.get("departmentName");
  }

  get BranchId() {
    return this.form.get("branchId");
  }

  get ParentDepartmentId() {
    return this.form.get("parentDepartmentId");
  }


  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedDepartment = null;
    this.selectedBranch = null;
    this.form.reset(); // Reset form cho chức năng thêm mới
    this.form.enable();
    this.form.get("parentDepartmentId").disable();
    // Đảm bảo rằng modalRef được gán cho this.modalRef
    this.modalRef = this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  openModalViewOrEdit(modalRef, department, mode: 'edit' | 'view'): void {
    // Kiểm tra đầu vào và bật loading
    if (!department || (mode !== 'edit' && mode !== 'view')) {
      console.error("Invalid input. Department or mode is incorrect.");
      return;
    }
    this.modalLoading = true;
    this.form.reset();
    this.modalMode = mode;
    this.selectedDepartment = department;

    // Thao tác khác nhau cho mode
    if (mode === 'edit') {
      this._departmentService.getDepartmentByBranch(department.branch.id).pipe(
        finalize(() => (this.modalLoading = false))
      ).subscribe(
        (response) => {
          this.filteredDepartments = response?.data || [];
          this.selectedBranch = department.branch;
          this.form.patchValue({
            departmentName: department.departmentName || '',
            branchId: department.branch?.id || null,
            parentDepartmentId: department.parentDepartment?.id || null,
          });
          this.form.enable();
        },
        (error) => console.error("Error fetching departments:", error)
      );
    } else {
      this.updateDepartmentFields();
      this.modalLoading = false;
    }

    // Mở modal nếu hợp lệ
    if (modalRef) {
      this.modalService.open(modalRef, {
        size: "lg",
        backdrop: "static",
        keyboard: false,
      });
    }
  }


  updateDepartmentFields(): void {
    this.departmentFields = [
      { label: 'Chi nhánh', value: this.selectedDepartment?.branchName },
      { label: 'Phòng ban gốc', value: this.selectedDepartment?.parenDepartmentName },
      { label: 'Tên phòng ban', value: this.selectedDepartment?.departmentName },
    ];
  }


  openDeleteModal(modalRef, department): void {
    if (department) {
      this.deleteIds = [department.id];
      this.selectedDepartment = department;
    } else {
      this.selectBranch = null;
    }
    // Lưu phòng ban cần xóa
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }



  async getBranches(): Promise<void> {
    try {
      const data = await this._branchService.getAllBranches().toPromise();
      const addOption = { id: 0, branchName: '+ Thêm mới chi nhánh' };
      this.branches = [addOption, ...data.data];
    } catch (error) {
      console.error("Có lỗi khi tải danh sách nhân viên", error);
    }
  }

  deleteDepartment(modal) {
    this.deleteLoading = true; // Thêm dòng này
    this._departmentService.deleteDepartment(this.deleteIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.toastr.success("Xóa phần ban thành công");
          this.selectedDepartment = null;
          this.deleteIds = [];
          this.loadParentDepartments();
          this.deleteLoading = false; // Thêm dòng này
          modal.close();
        }
      },
      (error) => {
        console.error("Error deleting department:", error);
        this.deleteLoading = false; // Thêm dòng này
      }
    );
  }


  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  /**
   * On init
   */
  ngOnInit(): void {
    this.loadParentDepartments();
    this.getBranches();
    this.cols = [
      { field: "departmentName", header: "Tên Phòng Ban" },
      { field: "branchName", header: "Tên Chi Nhánh" },
      { field: "parenDepartmentName", header: "Phòng Ban Gốc" },
    ];
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        //! If we have zoomIn route Transition then load datatable after 450ms(Transition will finish in 400ms)
        if (config.layout.animation === "zoomIn") {
          this._departmentService.onUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
              this.rows = response;
              this.tempData = this.rows;
            });
          this._branchService.onBranchListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((branchResponse) => {
              this.branches = branchResponse;
            });
          // Gọi hàm loadParentDepartments ở đây
        } else {
          this.loadParentDepartments();
          // Gọi hàm loadParentDepartments ở đây
        }
      });
    // Đảm bảo mảng không bị undefined
  }

  onBranchChange(selectedBranch: any) {
    const branchControl = this.form.get('branchId');
    if (selectedBranch && selectedBranch.id > 0) {
      branchControl?.setValue(selectedBranch.id);
      this.selectBranch = selectedBranch;
      this._departmentService.getDepartmentByBranch(this.selectBranch.id).subscribe(
        (response) => {
          // Kiểm tra phản hồi từ API
          if (response && response.data) {
            this.form.get('parentDepartmentId')?.setValue(null);
            this.filteredDepartments = response.data;
          } else {
            console.error("Failed to retrieve department list from branch.");
          }
        },
        (error) => {
          console.error("Error fetching department list from branch:", error);
        }
      );
      this.form.get('parentDepartmentId')?.enable();
    }
    else {
      this.filteredDepartments = [];
      this.selectBranch = null; // Reset selected branch
      branchControl?.setValue(null);
      branchControl?.markAsTouched();
      this.form.get('parentDepartmentId')?.setValue(null);
      this.form.get('parentDepartmentId')?.disable();
    }
  }

  loadParentDepartments(): void {
    this.loading = true;
    this._departmentService
      .getDataTableRows()
      .then((departmentResponse) => {
        // Dữ liệu phòng ban gốc
        this.departments = departmentResponse.map(
          convertDepartmentToTargetObject
        );

        this.loading = false;
        // Logging để kiểm tra dữ liệu trả về
      })
      .catch((error) => {
        console.error("Error loading departments:", error);
      });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}

function convertDepartmentToTargetObject(department) {  // Copy the department properties to the new structure
  const targetObject = {
    data: {
      ...department,
      branchName: department.branch.branchName,
      parenDepartmentName: department.parentDepartment?.departmentName,
    }, // Spread the existing properties of the department
    children: department.childDepartments
      ? department.childDepartments.map((child) =>
        convertDepartmentToTargetObject(child)
      )
      : [],
  };

  delete targetObject.data.childDepartments;

  return targetObject;
}
