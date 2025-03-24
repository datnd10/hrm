import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmployeeService } from 'app/main/apps/hrm-setting/employee/employee.service';
import { BANK_LIST } from 'common/bank-list';
import { noFutureDateValidator } from 'common/validation';
import { ValidationPatterns } from 'common/validation-patterns';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-select-employee',
  templateUrl: './select-employee.component.html',
  styleUrls: ['./select-employee.component.scss']
})
export class SelectEmployeeComponent implements OnInit {

  @Input() selectedDepartment: any;
  @Input() selectedEmployee: any;
  @Input() isDisabled: boolean = false;
  @Output() employeeChanged = new EventEmitter<any>();
  @Output() employeeAdded = new EventEmitter<any>();
  @Output() employeeBlurred = new EventEmitter<void>();


  @ViewChild("modalAddEmployee") modalAddEmployee: any;
  public employeeForm: any;
  public formEmployeeLoading: boolean = false;
  public seletedBranchModalAdd: any;
  public selectedPositionModalAdd: any;
  public employees: any = [];
  public isDepartmentDisabled = true;
  public isPositionDisabled = true;

  public provinces: any = [];
  public districts: any = [];
  public wards: any = [];
  public bankList: any[] = [];

  public genders = [
    { id: 1, name: "Nam" },
    { id: 2, name: "Nữ" },
    { id: 3, name: "Khác" },
  ];

  public roles = [
    { id: 1, name: "Admin" },
    { id: 2, name: "Nhân viên" },
  ];



  constructor(
    private _employeeService: EmployeeService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.initializeEmployeeForm();
    this.initialBankList();
    this._employeeService.getProvinces().subscribe((response) => {
      this.provinces = response;
    });

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDepartment']) {
      const department = changes['selectedDepartment'].currentValue;
      if (department?.id) {
        this.fetchEmployeesByDepartment(department.id); // Gọi API khi branch hợp lệ
      } else {
        this.employees = []; // Reset nếu branch không hợp lệ
        this.selectedDepartment = null; // Xóa nhân viên được chọn
      }
    }
  }

  async fetchEmployeesByDepartment(departmentId: string): Promise<void> {
    try {
      const employeeResponse: any = await this._employeeService
        .getEmployeeByDepartment(+departmentId)
        .toPromise();
      const addOption = { id: 0, fullName: '+ Thêm nhân viên' }
      this.employees = [addOption, ...employeeResponse?.data || []];
    } catch (error) {
      console.error("Có lỗi khi tải danh sách nhân viên:", error);
      this.toastr.error("Lỗi khi tải danh sách nhân viên.");
    }
  }

  compareEmployees(employee1: any, employee2: any): boolean {
    return employee1 && employee2 ? employee1.id === employee2.id : employee1 === employee2;
  }

  initializeEmployeeForm(): void {
    this.employeeForm = this.fb.group({
      fullName: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      gender: [null, Validators.required],
      dateOfBirth: ["", [Validators.required, noFutureDateValidator()]],
      idCard: ["", [Validators.pattern(ValidationPatterns.ID_CARD)]],
      province: [null],
      district: [{ value: null, disabled: true }],
      ward: [{ value: null, disabled: true }],
      specificAddress: [
        "",
        [Validators.minLength(3), Validators.maxLength(255)],
      ],
      email: [
        "",
        [Validators.required, Validators.pattern(ValidationPatterns.EMAIL)],
      ],
      phoneNumber: [
        "",
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern(ValidationPatterns.PHONE),
        ],
      ],
      taxCode: ["", [Validators.pattern(ValidationPatterns.TAX_CODE)]],
      provinceName: [""],
      districtName: [""],
      wardName: [""],
      password: [""],
      roleId: [null, Validators.required],
      branchId: [null, Validators.required],
      departmentId: [{ value: null, }, Validators.required],
      positionId: [{ value: null, }, Validators.required],
      accountId: [null],
      accountName: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      accountNumber: [
        "",
        [
          Validators.required,
        ],
      ],
      bankName: ["", Validators.required],
    });
  }

  onBranchAdded(newBranch: any): void {
    this.seletedBranchModalAdd = newBranch;
    this.employeeForm.get('branchId').setValue(newBranch.id);
    this.isDepartmentDisabled = false;
  }

  onBranchBlurred(): void {
    const branchControl = this.employeeForm.get('branchId');
    if (!branchControl?.value) {
      branchControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onBranchChanged(selectedBranch: any) {
    const branchControl = this.employeeForm.get('branchId');
    const departmentControl = this.employeeForm.get('departmentId');
    const positionControl = this.employeeForm.get('positionId');
    if (selectedBranch && selectedBranch.id > 0) {
      branchControl?.setValue(selectedBranch.id);
      this.seletedBranchModalAdd = selectedBranch;
      this.selectedDepartment = null;
      this.selectedPositionModalAdd = null;
      this.isDepartmentDisabled = false;
    }
    else {
      this.seletedBranchModalAdd = null;
      this.selectedDepartment = null;
      this.selectedPositionModalAdd = null;
      branchControl?.setValue(null);
      branchControl?.markAsTouched();
      departmentControl?.setValue(null);
      departmentControl?.markAsTouched();
      positionControl?.setValue(null);
      positionControl?.markAsTouched();
      this.isDepartmentDisabled = true;
      this.isPositionDisabled = true;
    }
  }

  onDepartmentAdded(newDepartment: any): void {
    if (this.seletedBranchModalAdd && this.seletedBranchModalAdd.id > 0 && newDepartment.branch.id === this.seletedBranchModalAdd.id) {
      this.employeeForm.get('departmentId').setValue(newDepartment.id);
      this.selectedDepartment = newDepartment;
      this.isPositionDisabled = false;
    }
    else {
      this.selectedDepartment = null;
      this.employeeForm.get('departmentId').setValue(null);
      this.isPositionDisabled = true;
    }
  }

  onDepartmentBlurred(): void {
    const departmentControl = this.employeeForm.get('departmentId');
    if (!departmentControl?.value) {
      departmentControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onDepartmentChanged(selectedDepartment: any) {
    const departmentControl = this.employeeForm.get('departmentId');
    const positionControl = this.employeeForm.get('positionId');
    if (selectedDepartment && selectedDepartment.id > 0) {
      departmentControl?.setValue(selectedDepartment.id);
      this.selectedDepartment = selectedDepartment;
      this.selectedPositionModalAdd = null;
      this.isPositionDisabled = false;
    }
    else {
      this.selectedDepartment = null;
      this.selectedPositionModalAdd = null;
      departmentControl?.setValue(null);
      departmentControl?.markAsTouched();
      positionControl?.setValue(null);
      positionControl?.markAsTouched();
      this.isPositionDisabled = true;
    }
  }

  onPositionAdded(newPosition: any): void {
    if (this.selectedDepartment && this.selectedDepartment.id > 0 && newPosition.department.id === this.selectedDepartment.id) {
      this.employeeForm.get('positionId').setValue(newPosition.id);
      this.selectedPositionModalAdd = newPosition;
    }
    else {
      this.selectedPositionModalAdd = null;
      this.employeeForm.get('positionId').setValue(null);
    }
  }

  onPositionBlurred(): void {
    const positionControl = this.employeeForm.get('positionId');
    if (!positionControl?.value) {
      positionControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onPositionChanged(selectedPosition: any) {
    const positionControl = this.employeeForm.get('positionId');
    if (selectedPosition && selectedPosition.id > 0) {
      positionControl?.setValue(selectedPosition.id);
      this.selectedPositionModalAdd = selectedPosition;
    }
    else {
      this.selectedPositionModalAdd = null;
      positionControl?.setValue(null);
      positionControl?.markAsTouched();
    }
  }

  openAddEmployeeModal(modalRef): void {
    this.employeeForm.reset();
    this.employeeForm.enable();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  onCloseEmployeeModal(modal: any): void {
    this.employeeForm.reset();
    modal.dismiss("Cross click");
    this.selectedEmployee = null;
    this.employeeChanged.emit(null);
  }

  onEmployeeChange(selected: any): void {
    if (selected?.id === 0) {
      this.openAddEmployeeModal(this.modalAddEmployee);
    }
    this.employeeChanged.emit(selected);
  }

  onBlur(): void {
    this.employeeBlurred.emit();
  }

  displayApiErrors(formGroup: FormGroup, apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (formGroup.controls[err.field]) {
        formGroup.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  onSubmitEmployeeReactiveForm(modal): void {
    this.formEmployeeLoading = true;
    if (this.employeeForm.valid) {
      const formData = this.employeeForm.value;
      const dataToSend: any = {
        ...(formData.fullName && { fullName: formData.fullName }),
        ...(formData.gender && { gender: formData.gender }),
        ...(formData.idCard && { idCard: formData.idCard }),
        ...(formData.taxCode && { taxCode: formData.taxCode }),
        ...(formData.email && { email: formData.email }),
        ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
        ...(formData.provinceName && { province: formData.provinceName }),
        ...(formData.districtName && { district: formData.districtName }),
        ...(formData.wardName && { ward: formData.wardName }),
        ...(formData.specificAddress && {
          specificAddress: formData.specificAddress,
        }),
        ...(formData.roleId && { roleId: formData.roleId }),
        ...(formData.departmentId && { departmentId: formData.departmentId }),
        ...(formData.positionId && { positionId: formData.positionId }),
        ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth }),
        // Thông tin tài khoản ngân hàng
        ...(formData.accountId && { accountId: formData.accountId }),
        ...(formData.accountName && { accountName: formData.accountName }),
        ...(formData.accountNumber && {
          accountNumber: formData.accountNumber,
        }),
        ...(formData.bankName && { bankName: formData.bankName }),
        ...(formData.password && { password: formData.password }),
      };

      this._employeeService.createEmployee(dataToSend).subscribe(
        (response) => {
          this.formEmployeeLoading = false;
          if (response.code === 201) {
            this.toastr.success("Thêm nhân viên thành công", "Thành công");
            this.employeeForm.reset();
            this.employeeAdded.emit(response.data);
            this.fetchEmployeesByDepartment(this.selectedDepartment.id);
            modal.close();
          } else {
            this.displayApiErrors(this.employeeForm, response.message);
          }
        },
        (error) => {
          this.formEmployeeLoading = false;
          console.error("Có lỗi xảy ra khi thêm mới", error);
        }
      );
    }
  }

  async onProvinceChange(event: any) {
    const provinceId = event?.code;
    if (provinceId) {
      const selectedProvince = this.provinces.find(
        (province) => province.code == provinceId
      );

      if (selectedProvince) {
        this.employeeForm.patchValue({
          province: provinceId,
          provinceName: selectedProvince.name,
        });
      }

      try {
        // Gọi API để lấy danh sách quận/huyện
        const data = await this._employeeService.getDistricts(provinceId).toPromise();
        this.districts = data.districts;

        this.employeeForm.get("district")?.enable();
        this.employeeForm.get("district")?.setValue(null);

        this.employeeForm.get("ward")?.setValue(null);
        this.employeeForm.get("ward")?.disable();
      } catch (error) {
        console.error("Lỗi khi tải danh sách quận/huyện:", error);
        this.toastr.error("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
      }
    } else {
      this.employeeForm.get("district")?.setValue(null);
      this.employeeForm.get("district")?.disable();
      this.employeeForm.get("ward")?.setValue(null);
      this.employeeForm.get("ward")?.disable();
    }
  }

  async onDistrictChange(event: any) {
    const districtId = event?.code;
    if (districtId) {
      const selectedDistrict = this.districts.find(
        (district) => district.code == districtId
      );

      if (selectedDistrict) {
        this.employeeForm.patchValue({
          district: districtId,
          districtName: selectedDistrict.name,
        });
      }

      try {
        const data = await this._employeeService.getWards(districtId).toPromise();
        this.wards = data.wards;

        this.employeeForm.get("ward")?.enable();
        this.employeeForm.get("ward")?.setValue(null);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phường/xã:", error);
        this.toastr.error("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
      }
    } else {
      this.employeeForm.get("ward")?.setValue(null);
      this.employeeForm.get("ward")?.disable();
    }
  }

  onWardChange(event: any) {
    const wardId = event?.code;
    if (wardId) {
      const selectedWard = this.wards.find((ward) => ward.code == wardId);
      if (selectedWard) {
        this.employeeForm.patchValue({
          ward: wardId,
          wardName: selectedWard.name,
        });
      }
    }
  }

  initialBankList() {
    this.bankList = BANK_LIST.map(bank => ({
      ...bank,
      bankName: `${bank.name} (${bank.code})`, // Định dạng Bank Name theo yêu cầu
    }));
  }
}
