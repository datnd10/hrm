import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PositionService } from 'app/main/apps/hrm-setting/position/position.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-select-position',
  templateUrl: './select-position.component.html',
  styleUrls: ['./select-position.component.scss']
})
export class SelectPositionComponent implements OnInit {

  @Input() selectedDepartment: any;
  @Input() selectedPosition: any;
  @Input() isDisabled: boolean = false;
  @Output() positionChanged = new EventEmitter<any>();
  @Output() positionAdded = new EventEmitter<any>();
  @Output() positionBlurred = new EventEmitter<void>();

  @ViewChild("modalAddPosition") modalAddPosition: any;
  public positionForm: any;
  public formPositionLoading: boolean = false;
  public seletedBranchModalAdd: any;
  public positions: any = [];
  public isDepartmentDisabled = true;

  constructor(
    private _positionService: PositionService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.initializePositionForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDepartment']) {
      const department = changes['selectedDepartment'].currentValue;
      if (department?.id) {
        this.fetchPositionsByDepartment(department.id); // Gọi API khi branch hợp lệ
      } else {
        this.positions = []; // Reset nếu branch không hợp lệ
        this.selectedDepartment = null; // Xóa chức vụ được chọn
      }
    }
  }

  async fetchPositionsByDepartment(departmentId: string): Promise<void> {
    try {
      const departmentResponse: any = await this._positionService
        .getPositionByDepartmentId(+departmentId)
        .toPromise();
      const addOption = { id: 0, positionName: '+ Thêm chức vụ' }
      this.positions = [addOption, ...departmentResponse?.data || []];
    } catch (error) {
      console.error("Có lỗi khi tải danh sách chức vụ:", error);
      this.toastr.error("Lỗi khi tải danh sách chức vụ.");
    }
  }

  comparePositions(position1: any, position2: any): boolean {
    return position1 && position2 ? position1.id === position2.id : position1 === position2;
  }

  initializePositionForm(): void {
    this.positionForm = this.fb.group({
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

  onBranchAdded(newBranch: any): void {
    this.seletedBranchModalAdd = newBranch;
    this.positionForm.get('branchName').setValue(newBranch.id);
    this.isDepartmentDisabled = false;
  }

  onBranchBlur(): void {
    const branchControl = this.positionForm.get('branchName');
    if (!branchControl?.value) {
      branchControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onBranchChange(selectedBranch: any) {
    const branchControl = this.positionForm.get('branchName');
    if (selectedBranch && selectedBranch.id > 0) {
      branchControl?.setValue(selectedBranch.id);
      this.seletedBranchModalAdd = selectedBranch;
      this.isDepartmentDisabled = false;
      this.positionForm.get('departmentId')?.enable();
    }
    else {
      branchControl?.setValue(null);
      branchControl?.markAsTouched();
      this.seletedBranchModalAdd = null;
      this.isDepartmentDisabled = true;
      this.positionForm.get('departmentId')?.disable();
      this.positionForm.get('departmentId')?.setValue(null);
    }
  }

  onDepartmentAdded(newDepartment: any): void {
    if (this.seletedBranchModalAdd && this.seletedBranchModalAdd.id > 0 && newDepartment.branch.id === this.seletedBranchModalAdd.id) {
      this.positionForm.get('departmentId').setValue(newDepartment.id);
      this.selectedDepartment = newDepartment;
    }
    else {
      this.selectedDepartment = null;
      this.positionForm.get('departmentId').setValue(null);
    }
  }

  onDepartmentBlurred(): void {
    const departmentControl = this.positionForm.get('departmentId');
    if (!departmentControl?.value) {
      departmentControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onDepartmentChanged(selectedDepartment: any) {
    const departmentControl = this.positionForm.get('departmentId');
    if (selectedDepartment && selectedDepartment.id > 0) {
      departmentControl?.setValue(selectedDepartment.id);
    }
    else {
      this.selectedDepartment = null;
      departmentControl?.setValue(null);
      departmentControl?.markAsTouched();
      this.positionForm.get('positionId').setValue(null);
    }
  }

  openAddPositionModal(modalRef): void {
    this.positionForm.reset();
    this.positionForm.enable();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  onClosePositionModal(modal: any): void {
    this.positionForm.reset();
    modal.dismiss("Cross click");
    this.selectedPosition = null;
    this.positionChanged.emit(null);
  }

  onPositionChange(selected: any): void {
    if (selected?.id === 0) {
      this.openAddPositionModal(this.modalAddPosition);
    }
    this.positionChanged.emit(selected);
  }

  onBlur(): void {
    this.positionBlurred.emit();
  }

  displayApiErrors(formGroup: FormGroup, apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (formGroup.controls[err.field]) {
        formGroup.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  onSubmitPositionReactiveForm(modal): void {
    this.formPositionLoading = true;
    if (this.positionForm.valid) {
      const { positionName, departmentId } = this.positionForm.value;
      // Tạo đối tượng chỉ chứa hai trường cần thiết
      const positionData = { positionName, departmentId };
      this._positionService.createPosition(positionData).subscribe(
        (response) => {
          this.formPositionLoading = false;
          if (response.code === 201) {
            this.toastr.success("Thêm chức vụ thành công", "Thành công");
            this.positionForm.reset();
            this.positionAdded.emit(response.data);
            this.fetchPositionsByDepartment(this.selectedDepartment.id);
            this.seletedBranchModalAdd = null;
            modal.close();
          }
          else {
            this.displayApiErrors(this.positionForm, response.message);
          }
        },
        (error) => {
          console.error("Có lỗi xảy ra khi thêm chức vụ", error);
        }
      );
    }
  }
}
