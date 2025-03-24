import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import {
  ColumnMode,
  DatatableComponent,
  SelectionType,
} from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { catchError, finalize, takeUntil } from "rxjs/operators";

import { CoreConfigService } from "@core/services/config.service";
import { PositionService } from "./position.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FormBuilder, FormGroup, NgForm, Validators } from "@angular/forms";
import { BranchService } from "../branch/branch.service";
import { ToastrService } from "ngx-toastr";
import { Position } from "ngx-perfect-scrollbar";
import { DepartmentService } from "../department/department.service";

@Component({
  selector: "app-position-list",
  templateUrl: "./position.component.html",
  styleUrls: ["./position.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PositionComponent implements OnInit {
  public positions: any = [];
  public modalRef: any;
  public selectedIds = [];
  public deletedIds = [];
  public searchValue1 = "";
  public modalMode: "add" | "edit" | "view" = "add";
  public selectedPosition: any = null;
  public modalLoading: boolean = false;
  public formLoading: boolean = false;
  public deleteLoading: boolean = false;
  public loading: boolean = false;
  public selectedItems: any[] = [];

  public selectedBranch: any = null;
  public selectedDepartment: any = null;
  public isDisabled = true;

  tableTitle: string = "Quản lý chức vụ";
  positionsArray: any;
  columnArray: any[] = [
    {
      header: "Chức vụ",
      fieldName: "positionName",
      dataType: "string",
      width: "700px",
    },
    {
      header: "Phòng ban",
      fieldName: "departmentName",
      dataType: "string",
      width: "700px",
    },
    {
      header: "Chi nhánh",
      fieldName: "branchName",
      dataType: "string",
      width: "700px",
    },
  ];

  totalItems: number = 0; // Tổng số bản ghi (lấy từ API)
  itemsPerPage: number = 10; // Số bản ghi mỗi trang
  currentPage: number = 1; // Trang hiện tại
  totalPage: number = 0; // Tổng số trang

  sortColumn: string = "createdAt"; // Cột sắp xếp mặc định
  sortDirection: string = "DESC"; // Hướng sắp xếp mặc định

  @ViewChild("modalAddEdit") modalAddEdit: any;
  @ViewChild("modalView") modalView: any;
  @ViewChild("modalDelete") modalDelete: any;

  searchByPositionName: string;
  searchByDepartment: string;
  searchByBranch: string;

  branchsArray: any[] = [];
  departmentsArray: any[] = [];
  positionFields: Array<{ label: string; value: string | null }> = [];

  @ViewChild(DatatableComponent) table: DatatableComponent;

  private tempData = [];
  private _unsubscribeAll: Subject<any>;
  private form: FormGroup;
  public selectBranch: any = null;


  constructor(
    private _positionService: PositionService,
    private _departmentService: DepartmentService,
    private _branchService: BranchService,
    private _coreConfigService: CoreConfigService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.form = this.fb.group({
      branchName: [null, Validators.required],
      departmentId: [null, Validators.required],
      positionName: [
        "",
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(255),
        ],
      ],
    });

  }

  displayApiErrors(formGroup: FormGroup, apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (formGroup.controls[err.field]) {
        formGroup.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  onBranchAdded(newBranch: any): void {
    this.form.get('branchName').setValue(newBranch.id);
    this.selectedBranch = newBranch;
    this.isDisabled = false;
  }

  onBranchBlurred(): void {
    const branchControl = this.form.get('branchName');
    if (!branchControl?.value) {
      branchControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onBranchChanged(selectedBranch: any) {
    const branchControl = this.form.get('branchName');
    if (selectedBranch && selectedBranch.id > 0) {
      branchControl?.setValue(selectedBranch.id);
      this.selectBranch = selectedBranch;
      this.selectedBranch = selectedBranch;
      this.selectedDepartment = null;
      this.isDisabled = false;
    }
    else {
      this.selectBranch = null;
      this.selectedBranch = null;
      this.selectedDepartment = null;
      branchControl?.setValue(null);
      branchControl?.markAsTouched();
      this.isDisabled = true;
      this.form.get('departmentId').setValue(null);
    }
  }

  onDepartmentAdded(newDepartment: any): void {
    if (this.selectBranch && this.selectBranch.id > 0 && newDepartment.branch.id === this.selectBranch.id) {
      this.form.get('departmentId').setValue(newDepartment.id);
      this.selectedDepartment = newDepartment;
    }
    else {
      this.selectedDepartment = null;
      this.form.get('departmentId').setValue(null);
    }
  }

  onDepartmentBlurred(): void {
    const departmentControl = this.form.get('departmentId');
    if (!departmentControl?.value) {
      departmentControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onDepartmentChanged(selectedDepartment: any) {
    const departmentControl = this.form.get('departmentId');
    if (selectedDepartment && selectedDepartment.id > 0) {
      departmentControl?.setValue(selectedDepartment.id);
      this.selectedDepartment = selectedDepartment;
    }
    else {
      this.selectedDepartment = null;
      departmentControl?.setValue(null);
      departmentControl?.markAsTouched();
    }
  }

  onSearch(searchTerm: string): void {
    this.searchByPositionName = searchTerm.trim();
    this.currentPage = 1;
    this.fetchPositionList();
  }

  filterByBranch(branch: any): void {
    this.searchByDepartment = null;
    this.currentPage = 1;
    if (!branch) {
      this.searchByBranch = null;
      this.searchByDepartment = null;
      this.departmentsArray = [];
    } else {
      this.searchByBranch = branch.id;
      this._departmentService
        .getDepartmentByBranch(branch.id)
        .subscribe((data) => {
          this.departmentsArray = data.data || [];
        });
    }

    this.fetchPositionList();
  }

  filterByDepartment(department: any): void {
    this.currentPage = 1;
    if (!department) {
      this.searchByDepartment = null;
    } else {
      this.searchByDepartment = department.id;
    }
    this.fetchPositionList();
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchPositionList();
  }

  // Hàm thay đổi số bản ghi mỗi trang
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchPositionList();
  }

  // Hàm nhận sự kiện sắp xếp từ void-table.component.ts
  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchPositionList();
  }

  addPosition() {
    this.openAddModal(this.modalAddEdit);
  }

  viewPosition(data: any) {
    this.openDetailsModal(this.modalView, data);
  }

  editPosition(data: any) {
    this.openEditModal(this.modalAddEdit, data);
  }

  deletePosition(data: any) {
    this.openDeleteModal(this.modalDelete, data);
  }

  // Hàm xử lý dữ liệu từ sự kiện onSendSelected
  handleSendSelected() {
    this.deletedIds = this.selectedItems.map((item) => item.id);

    this.openDeleteModal(this.modalDelete);
    // Thực hiện các xử lý tiếp theo với dữ liệu đã chọn
  }
  anySelected(): boolean {
    return this?.selectedItems?.length > 0; // Trả về true nếu có phần tử được chọn
  }

  handleSelectedItemsChange(selectedItems: any[]) {
    this.selectedItems = selectedItems;
    this.anySelected();
  }

  onSubmitReactiveForm(modal): void {
    this.formLoading = true;
    if (this.form.valid) {
      const formData = this.form.value;
      const dataToSend = {
        departmentId: formData.departmentId,
        positionName: formData.positionName,
      };

      if (this.modalMode === "add") {
        // Gọi API tạo mới
        this._positionService.createPosition(dataToSend).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success("Thêm vị trí thành công", "Thành công");
              modal.close();
              this.fetchPositionList();
              this.form.reset();
            } else {
              this.displayApiErrors(this.form, response.message);
            }
          },
          (error) => {
            this.formLoading = false;
            console.error("Có lỗi xảy ra khi thêm mới", error);
          }
        );
      } else if (this.modalMode === "edit" && this.selectedPosition) {
        // Gọi API chỉnh sửa
        this._positionService
          .updatePosition(this.selectedPosition.id, dataToSend)
          .subscribe(
            (response) => {
              this.formLoading = false;
              if (response.code === 200) {
                this.toastr.success(
                  "Chỉnh sửa chi nhánh thành công",
                  "Thành công"
                );
                modal.close();
                this.fetchPositionList();
                this.form.reset();
              } else {
                this.displayApiErrors(this.form, response.message);
              }
            },
            (error) => {
              this.formLoading = false;
              console.error("Có lỗi xảy ra khi chỉnh sửa", error);
            }
          );
      }
    }
  }

  deleteSelectedBranches(modal): void {
    this.deleteLoading = true;
    this._positionService.deletePosition(this.deletedIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.deleteLoading = false;
          this.toastr.success("Xóa chức vụ thành công");
          this.fetchPositionList();
          this.selectedIds = [];
          this.deletedIds = [];
          modal.close();
        } else {
          this.deleteLoading = false;
          this.toastr.error("Xóa chức vụ thất bại");
          modal.close();
        }
      },
      (error) => {
        this.deleteLoading = false;
        console.error("Có lỗi xảy ra khi xóa chức vụ", error);
      }
    );
  }

  // Fetch data for the list of positions
  fetchPositionList(): void {
    this.loading = true;
    this._positionService
      .filterPositions(
        this.currentPage,
        this.itemsPerPage,
        this.sortColumn,
        this.sortDirection,
        this.searchByBranch,
        this.searchByDepartment,
        this.searchByPositionName
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          this.toastr.error("Lỗi khi tải danh sách chức vụ.");
          console.error("Position Fetch Error:", error);
          return [];
        })
      )
      .subscribe((data: any) => {
        this.positionsArray = data?.data?.items.map((item: any) => {
          return {
            ...item,
            branchName: item.branch.branchName,
            departmentName: item.department.departmentName,
          };
        });

        this.totalItems = data?.data?.meta.totalItems;
        this.currentPage = data?.data?.meta.currentPage;
        this.itemsPerPage = data?.data?.meta.itemsPerPage;
        this.totalPage = data?.data?.meta.totalPages;
      });
  }

  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedPosition = null;
    this.selectedBranch = null;
    this.selectedDepartment = null;
    this.form.reset();
    this.form.enable();
    this.isDisabled = true;
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  openDeleteModal(modalRef, position?: any): void {
    if (position) {
      this.deletedIds = [position.id];
      this.selectedPosition = position;
    } else {
      this.selectedPosition = null;
    }
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  onCloseModal(modal: any): void {
    this.form.reset();
    this.selectedBranch = null;
    this.selectedDepartment = null;
    this.isDisabled = true;
    modal.dismiss("Cross click");
  }

  updatePositionFields(): void {
    this.positionFields = [
      { label: 'Chi nhánh', value: this.selectedPosition?.branch?.branchName },
      { label: 'Phòng ban', value: this.selectedPosition?.department?.departmentName },
      { label: 'Tên chức vụ', value: this.selectedPosition?.positionName },
    ];
  }

  async openDetailsOrUpdateModal(
    modalRef,
    position: any,
    mode: "view" | "edit"
  ): Promise<void> {
    this.modalLoading = true;
    this.modalMode = mode;

    // Mở modal
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    try {
      // Gọi API để lấy thông tin position
      const response: any = await this._positionService.getOnePosition(position.id).toPromise();

      if (response?.data) {
        this.selectedPosition = response.data;

        if (mode === "edit") {
          this.isDisabled = false;
          this.selectedBranch = this.selectedPosition.branch;
          this.selectedDepartment = this.selectedPosition.department;
          // Patch dữ liệu vào form
          const detailPosition = {
            branchName: this.selectedPosition.branch.id || "",
            departmentId: this.selectedPosition.department.id || "",
            positionName: this.selectedPosition.positionName || "",
          };

          this.form.patchValue(detailPosition);
          this.form.enable(); // Cho phép chỉnh sửa
        } else if (mode === "view") {
          this.updatePositionFields(); // Hiển thị thông tin view
          this.form.disable(); // Khóa form trong chế độ xem
        }
      } else {
        this.toastr.error(`Không có dữ liệu cho Position ID: ${position.id}`);
      }
    } catch (error) {
      console.error("Error fetching position details:", error);
      this.toastr.error("Lỗi khi tải thông tin Position.");
    } finally {
      this.modalLoading = false; // Đảm bảo luôn tắt modalLoading
    }
  }

  openDetailsModal(modalRef, position: Position): void {
    this.openDetailsOrUpdateModal(modalRef, position, "view");
  }

  openEditModal(modalRef, position: Position): void {
    this.openDetailsOrUpdateModal(modalRef, position, "edit");
  }

  async getBranches(): Promise<void> {
    try {
      const data = await this._branchService.getAllBranches().toPromise();
      this.branchsArray = data?.data || [];
    } catch (error) {
      console.error("Có lỗi khi tải danh sách nhân viên", error);
    }
  }

  ngOnInit(): void {
    this.positionsArray = [];
    this.getBranches();
    this.fetchPositionList();
    // Subscribe to config changes
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll)) // Unsubscribe when component is destroyed
      .subscribe((config) => {
        //! If there is zoomIn route transition, delay the datatable load
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._positionService.onPositionListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.positions = response;
                this.tempData = this.positions;
              });
          }, 450);
        } else {
          this._positionService.onPositionListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((branchResponse) => {
            });
        }
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
