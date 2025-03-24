import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CoreConfigService } from '@core/services/config.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BranchService } from 'app/main/apps/hrm-setting/branch/branch.service';
import { DepartmentService } from 'app/main/apps/hrm-setting/department/department.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-select-department',
  templateUrl: './select-department.component.html',
  styleUrls: ['./select-department.component.scss']
})
export class SelectDepartmentComponent implements OnInit {


  @Input() selectedBranch: any;
  @Input() selectedDepartment: any;
  @Input() isDisabled: boolean = false;
  @Output() departmentChanged = new EventEmitter<any>();
  @Output() departmentAdded = new EventEmitter<any>();
  @Output() departmentBlurred = new EventEmitter<void>();

  @ViewChild("modalAddDepartment") modalAddDepartment: any;
  public departmentForm: any;
  public formDepartmentLoading: boolean = false;
  public departments: any = [];
  public filteredDepartments = [];
  public branches: any;
  constructor(
    private _departmentService: DepartmentService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.initializeDepartmentForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDepartment']) {
      this.selectedDepartment = changes['selectedDepartment'].currentValue || null;
    }
    if (changes['selectedBranch']) {
      const branch = changes['selectedBranch'].currentValue;
      if (branch?.id) {
        this.fetchDepartmentsByBranch(branch.id); // Gọi API khi branch hợp lệ
      } else {
        this.departments = []; // Reset nếu branch không hợp lệ
        this.selectedDepartment = null; // Xóa phòng ban được chọn
      }
    }
  }

  async fetchDepartmentsByBranch(branchId: string): Promise<void> {
    try {
      const departmentResponse: any = await this._departmentService
        .getDepartmentByBranch(+branchId)
        .toPromise();
      const addOption = { id: 0, departmentName: '+ Thêm phòng ban' }
      this.departments = [addOption, ...departmentResponse?.data || []];
    } catch (error) {
      console.error("Có lỗi khi tải danh sách phòng ban:", error);
      this.toastr.error("Lỗi khi tải danh sách phòng ban.");
    }
  }

  compareDepartments(department1: any, department2: any): boolean {
    return department1 && department2 ? department1.id === department2.id : department1 === department2;
  }

  initializeDepartmentForm(): void {
    this.departmentForm = this.fb.group({
      departmentName: [
        "",
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(255),
        ],
      ],
      branchId: [
        "",
        [
          Validators.required,
          Validators.pattern("^[0-9]+$"),
          Validators.minLength(1),
          Validators.maxLength(10),
        ],
      ],
      parentDepartmentId: [
        { value: null },
        [
          Validators.minLength(1),
          Validators.maxLength(10),
          Validators.pattern("^[0-9]+$"),
        ],
      ],
    });
  }

  onBranchAdded(newBranch: any): void {
    this.departmentForm.get('branchId').setValue(newBranch.id);
  }

  onBranchBlur(): void {
    const branchControl = this.departmentForm.get('branchId');
    if (!branchControl?.value) {
      branchControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onBranchChange(selectedBranch: any) {
    const branchControl = this.departmentForm.get('branchId');
    if (selectedBranch && selectedBranch.id > 0) {
      branchControl?.setValue(selectedBranch.id);
      this._departmentService.getDepartmentByBranch(selectedBranch.id).subscribe(
        (response) => {
          if (response && response.data) {
            this.filteredDepartments = response.data;
          } else {
            console.error("Failed to retrieve department list from branch.");
          }
        },
        (error) => {
          console.error("Error fetching department list from branch:", error);
        }
      );
      this.departmentForm.get('parentDepartmentId')?.enable();
    }
    else {
      this.filteredDepartments = [];
      branchControl?.setValue(null);
      branchControl?.markAsTouched();
      this.departmentForm.get('parentDepartmentId')?.setValue(null);
    }
  }

  openAddDepartmentModal(modalRef): void {
    this.departmentForm.reset(); // Reset depart.departmentForm cho chức năng thêm mới
    this.departmentForm.enable();
    // this.departmentForm.get("parentDepartmentId").disable();
    this.filteredDepartments = [];
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  onCloseDepartmentModal(modal: any): void {
    this.departmentForm.reset();
    modal.dismiss("Cross click");
    this.selectedDepartment = null;
    this.departmentChanged.emit(null);
  }

  onDepartmentChange(selected: any): void {
    if (selected?.id === 0) {
      this.openAddDepartmentModal(this.modalAddDepartment);
    }
    this.departmentChanged.emit(selected);
  }

  onBlur(): void {
    this.departmentBlurred.emit();
  }

  displayApiErrors(formGroup: FormGroup, apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (formGroup.controls[err.field]) {
        formGroup.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  onSubmitDepartmentReactiveForm(modal): void {
    this.formDepartmentLoading = true;
    if (this.departmentForm.valid) {
      const departmentData = this.departmentForm.value;
      this._departmentService.createDepartment(departmentData).subscribe(
        (response) => {
          this.formDepartmentLoading = false;
          if (response.code === 201) {
            this.toastr.success("Thêm phòng ban thành công", "Thành công");
            modal.close();
            this.departmentForm.reset();
            this.departmentAdded.emit(response.data);
            this.fetchDepartmentsByBranch(this.selectedBranch.id);
            modal.close();
          }
          else {
            this.displayApiErrors(this.departmentForm, response.message);
          }
        },
        (error) => {
          console.error("Có lỗi xảy ra khi thêm phòng ban", error);
        }
      );
    }
  }
}
