import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BranchService } from 'app/main/apps/hrm-setting/branch/branch.service';
import { ValidationPatterns } from 'common/validation-patterns';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-select-branch',
  templateUrl: './select-branch.component.html',
  styleUrls: ['./select-branch.component.scss']
})
export class SelectBranchComponent implements OnInit {
  @Input() selectedBranch: any;
  @Input() isDisabled: boolean = false;
  @Output() branchChanged = new EventEmitter<any>(); // Event khi chọn phòng ban
  @Output() branchAdded = new EventEmitter<any>(); // Event khi thêm mới phòng ban
  @Output() branchBlurred = new EventEmitter<void>();

  @ViewChild("modalAddBranch") modalAddBranch: any;
  public branchForm: any;
  public provinces: any = [];
  public districts: any = [];
  public wards: any = [];
  public formBranchLoading: boolean = false;
  public branches: any = [];

  constructor(
    private _branchService: BranchService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this._branchService.getProvinces().subscribe((response) => {
      this.provinces = response;
    });
    this.getBranches();
    const addOption = { id: 0, branchName: '+ Thêm mới chi nhánh' };
    this.branches = [addOption, ...this.branches];
    this.initializeBranchForm();
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedBranch']) {
      this.selectedBranch = changes['selectedBranch'].currentValue || null;
    }
  }

  compareBranches(branch1: any, branch2: any): boolean {
    return branch1 && branch2 ? branch1.id === branch2.id : branch1 === branch2;
  }


  onBlur(): void {
    this.branchBlurred.emit(); // Phát sự kiện khi mất focus
  }

  onBranchChange(selected: any): void {
    if (selected?.id === 0) {
      this.openAddBranchModal(this.modalAddBranch);
    }
    this.branchChanged.emit(selected);
  }

  onCloseBranchModal(modal: any): void {
    this.branchForm.reset(); // Reset toàn bộ branchForm
    this.branchForm.get("ward")?.disable(); // Vô hiệu hóa trường `ward`
    this.branchForm.get("district")?.disable(); // Vô hiệu hóa trường `district`
    this.selectedBranch = null; // Loại bỏ giá trị hiện tại
    this.branchChanged.emit(null); // Phát sự kiện giá trị null
    modal.dismiss("Cross click"); // Đóng modal
  }


  initializeBranchForm(): void {
    this.branchForm = this.fb.group({
      branchName: [
        "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
        ],
      ],
      province: [null],
      district: [{ value: null, disabled: true }],
      ward: [{ value: null, disabled: true }],
      specificAddress: [
        "",
        [Validators.minLength(3), Validators.maxLength(255)],
      ],
      email: ["", [Validators.pattern(ValidationPatterns.EMAIL)]],
      phoneNumber: [
        "",
        [
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern(ValidationPatterns.PHONE),
        ],
      ],
      taxCode: ["", [Validators.pattern(ValidationPatterns.TAX_CODE)]],
      provinceName: [""],
      districtName: [""],
      wardName: [""],
    });
  }

  openAddBranchModal(modalRef): void {
    this.branchForm.get("ward").disable();
    this.branchForm.get("district").disable();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  async onProvinceBranchChange(event: any) {
    const provinceId = event?.code;
    if (provinceId) {
      const selectedProvince = this.provinces.find(
        (province) => province.code == provinceId
      );

      if (selectedProvince) {
        this.branchForm.patchValue({
          province: provinceId,
          provinceName: selectedProvince.name,
        });
      }

      try {
        // Gọi API để lấy danh sách quận/huyện
        const data = await this._branchService.getDistricts(provinceId).toPromise();
        this.districts = data.districts;

        this.branchForm.get("district")?.enable();
        this.branchForm.get("district")?.setValue(null);

        this.branchForm.get("ward")?.setValue(null);
        this.branchForm.get("ward")?.disable();
      } catch (error) {
        console.error("Lỗi khi tải danh sách quận/huyện:", error);
        this.toastr.error("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
      }
    } else {
      this.branchForm.get("district")?.setValue(null);
      this.branchForm.get("district")?.disable();
      this.branchForm.get("ward")?.setValue(null);
      this.branchForm.get("ward")?.disable();
    }
  }

  onSubmitBranchReactiveForm(modal: any): void {
    this.formBranchLoading = true;
    if (this.branchForm.valid) {
      const formData = this.branchForm.value;
      const dataToSend: any = {
        ...(formData.branchName && { branchName: formData.branchName }),
        ...(formData.provinceName && { province: formData.provinceName }),
        ...(formData.districtName && { district: formData.districtName }),
        ...(formData.wardName && { ward: formData.wardName }),
        ...(formData.specificAddress && {
          specificAddress: formData.specificAddress,
        }),
        ...(formData.email && { email: formData.email }),
        ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
        ...(formData.taxCode && { taxCode: formData.taxCode }),
      };

      this._branchService.createBranch(dataToSend).subscribe(
        (response) => {
          this.formBranchLoading = false;
          if (response.code === 201) {
            this.toastr.success("Thêm chi nhánh thành công", "Thành công");
            modal.close();
            this.getBranches();
            this.selectedBranch = response.data;
            this.branchAdded.emit(response.data);
            this.branchForm.reset();
          } else {
            this.displayApiErrors(this.branchForm, response.message);
          }
        },
        (error) => {
          this.formBranchLoading = false;
          console.error("Có lỗi xảy ra khi thêm mới", error);
        }
      );
    }
  }

  displayApiErrors(formGroup: FormGroup, apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (formGroup.controls[err.field]) {
        formGroup.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  async onProvinceChange(event: any) {
    const provinceId = event?.code;
    if (provinceId) {
      const selectedProvince = this.provinces.find(
        (province) => province.code == provinceId
      );

      if (selectedProvince) {
        this.branchForm.patchValue({
          province: provinceId,
          provinceName: selectedProvince.name,
        });
      }

      try {
        // Gọi API để lấy danh sách quận/huyện
        const data = await this._branchService.getDistricts(provinceId).toPromise();
        this.districts = data.districts;
        this.branchForm.get("district")?.enable();
        this.branchForm.get("district")?.setValue(null);

        this.branchForm.get("ward")?.setValue(null);
        this.branchForm.get("ward")?.disable();
      } catch (error) {
        console.error("Lỗi khi tải danh sách quận/huyện:", error);
        this.toastr.error("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
      }
    } else {
      this.branchForm.get("district")?.setValue(null);
      this.branchForm.get("district")?.disable();
      this.branchForm.get("ward")?.setValue(null);
      this.branchForm.get("ward")?.disable();
    }
  }

  async onDistrictChange(event: any) {
    const districtId = event?.code;
    if (districtId) {
      const selectedDistrict = this.districts.find(
        (district) => district.code == districtId
      );
      if (selectedDistrict) {
        this.branchForm.patchValue({
          district: districtId,
          districtName: selectedDistrict.name,
        });
      }

      try {
        const data = await this._branchService.getWards(districtId).toPromise();
        this.wards = data.wards;

        this.branchForm.get("ward")?.enable();
        this.branchForm.get("ward")?.setValue(null);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phường/xã:", error);
        this.toastr.error("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
      }
    } else {
      this.branchForm.get("ward")?.setValue(null);
      this.branchForm.get("ward")?.disable();
    }
  }

  onWardChange(event: any) {
    const wardId = event?.code;
    if (wardId) {
      const selectedWard = this.wards.find((ward) => ward.code == wardId);
      if (selectedWard) {
        this.branchForm.patchValue({
          ward: wardId,
          wardName: selectedWard.name,
        });
      }
    }
  }
}
