import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import {
  ColumnMode,
  DatatableComponent,
  SelectionType,
} from "@swimlane/ngx-datatable";
import { FlatpickrOptions } from "ng2-flatpickr";
import { Subject } from "rxjs";
import { NgbDateStruct, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreConfigService } from "@core/services/config.service";
import { ToastrService } from "ngx-toastr";
import { ValidationPatterns } from "common/validation-patterns";
import { Branch } from "shared/models/branch.model";
import { catchError, finalize, takeUntil } from "rxjs/operators";
import { EmployeeService } from "./employee.service";
import { PositionService } from "../position/position.service";
import { noFutureDateValidator } from "common/validation";
import { BranchService } from "../branch/branch.service";
import { DepartmentService } from "../department/department.service";
import { AccountListService } from "../../finance/account-list/account-list.service";
import { BANK_LIST } from "common/bank-list";

@Component({
  selector: "app-employee",
  templateUrl: "./employee.component.html",
  styleUrls: ["./employee.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class EmployeeComponent implements OnInit {
  // Public
  public temp = [];
  public rows: any[] = [];
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public departments: any = [{ id: 0, departmentName: '+ Thêm mới phòng ban' }];
  public branches: any = { id: 0, branchName: '+ Thêm mới chi nhánh' };
  public provinces: any = [];
  public districts: any = [];
  public wards: any = [];
  public modalMode: "add" | "edit" | "view" = "add";
  public selectedEmployee: any = null;
  public selectedIds = [];
  public deletedIds = [];
  public SelectionType = SelectionType;
  public selectedRows: any[] = [];
  public positions: any = [];
  public modalRef: any;

  public genders = [
    { id: 1, name: "Nam" },
    { id: 2, name: "Nữ" },
    { id: 3, name: "Khác" },
  ];

  public roles = [
    { id: 1, name: "Admin" },
    { id: 2, name: "Nhân viên" },
  ];

  public basicDateOptions: FlatpickrOptions = {
    altInput: true,
  };
  formErrors: { [key: string]: string[] } = {};
  public basicDPdata: NgbDateStruct;

  tableTitle: string = "Quản lý nhân viên";
  employeesArray: any[] = [];
  columnArray: any[] = [
    {
      header: "Họ và tên",
      fieldName: "fullName",
      dataType: "string",
      width: "500px",
    },
    {
      header: "Giới tính",
      fieldName: "gender",
      dataType: "string",
      width: "500px",
    },
    {
      header: "Số điện thoại",
      fieldName: "phoneNumber",
      dataType: "string",
      width: "500px",
    },
    {
      header: "Chức vụ",
      fieldName: "positionName",
      dataType: "string",
      width: "500px",
    },
    {
      header: "Phòng ban",
      fieldName: "departmentName",
      dataType: "string",
      width: "500px",
    },
    {
      header: "Chi nhánh",
      fieldName: "branchName",
      dataType: "string",
      width: "500px",
    },
    { header: "Quyền", fieldName: "role", dataType: "string", width: "500px" },
  ];

  totalItems: number = 0; // Tổng số bản ghi (lấy từ API)
  itemsPerPage: number = 10; // Số bản ghi mỗi trang
  currentPage: number = 1; // Trang hiện tại
  totalPage: number = 0; // Tổng số trang

  sortColumn: string = "createdAt"; // Cột sắp xếp mặc định
  sortDirection: string = "DESC"; // Hướng sắp xếp mặc định

  @ViewChild("modalBasic") modalBasic: any;
  @ViewChild("modalDelete") modalDelete: any;
  @ViewChild("modalView") modalView: any;

  searchByPosition: string;
  searchByDepartment: string;
  searchByBranch: string;
  searchByFullName: string;
  searchByRole: string;

  branchsArray: any[] = [];
  departmentsArray: any[] = [];
  positionsArray: any[] = [];

  // Decorator
  @ViewChild(DatatableComponent) table: DatatableComponent;

  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;
  private form: FormGroup;
  public loading: boolean = true;
  public formLoading: boolean = false;
  public modalLoading: boolean = false;
  public deleteLoading: boolean = false;
  public isLoadingDistricts = false;
  public isLoadingWards = false;
  public bankList: any[] = [];
  public selectedItems: any[] = [];

  employeeFields: Array<{ label: string; value: string | null }> = [];

  public selectedBranch: any = null;
  public selectedDepartment: any = null;
  public selectedPosition: any = null;
  public isDepartmentDisabled = true;
  public isPositionDisabled = true;


  constructor(
    private _employeeService: EmployeeService,
    private _branchService: BranchService,
    private _departmentService: DepartmentService,
    private _positionService: PositionService,
    private _accountListService: AccountListService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.initializeForm();
  }

  onBranchAdded(newBranch: any): void {
    this.form.get('branchId').setValue(newBranch.id);
    this.selectedBranch = newBranch;
    this.isDepartmentDisabled = false;
  }

  onBranchBlurred(): void {
    const branchControl = this.form.get('branchId');
    if (!branchControl?.value) {
      branchControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onBranchChanged(selectedBranch: any) {
    const branchControl = this.form.get('branchId');
    const departmentControl = this.form.get('departmentId');
    const positionControl = this.form.get('positionId');
    if (selectedBranch && selectedBranch.id > 0) {
      branchControl?.setValue(selectedBranch.id);
      this.selectedBranch = selectedBranch;
      this.selectedDepartment = null;
      this.selectedPosition = null;
      this.isDepartmentDisabled = false;
    }
    else {
      this.selectedBranch = null;
      this.selectedDepartment = null;
      this.selectedPosition = null;
      branchControl?.setValue(null);
      branchControl?.markAsTouched();
      departmentControl?.markAsTouched();
      positionControl?.markAsTouched();
      this.isDepartmentDisabled = true;
      this.isPositionDisabled = true;
      departmentControl.setValue(null);
      positionControl.setValue(null);
    }
  }

  onDepartmentAdded(newDepartment: any): void {
    if (this.selectedBranch && this.selectedBranch.id > 0 && newDepartment.branch.id === this.selectedBranch.id) {
      this.form.get('departmentId').setValue(newDepartment.id);
      this.selectedDepartment = newDepartment;
      this.isPositionDisabled = false;
    }
    else {
      this.selectedDepartment = null;
      this.form.get('departmentId').setValue(null);
      this.isPositionDisabled = true;
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
    const positionControl = this.form.get('positionId');
    if (selectedDepartment && selectedDepartment.id > 0) {
      departmentControl?.setValue(selectedDepartment.id);
      this.selectedDepartment = selectedDepartment;
      this.selectedPosition = null;
      this.isPositionDisabled = false;
    }
    else {
      this.selectedDepartment = null;
      this.selectedPosition = null;
      departmentControl?.setValue(null);
      departmentControl?.markAsTouched();
      positionControl?.markAsTouched();
      this.isPositionDisabled = true;
      positionControl.setValue(null);
    }
  }

  onPositionAdded(newPosition: any): void {
    if (this.selectedDepartment && this.selectedDepartment.id > 0 && newPosition.department.id === this.selectedDepartment.id) {
      this.form.get('positionId').setValue(newPosition.id);
      this.selectedPosition = newPosition;
    }
    else {
      this.selectedPosition = null;
      this.form.get('positionId').setValue(null);
    }
  }

  onPositionBlurred(): void {
    const positionControl = this.form.get('positionId');
    if (!positionControl?.value) {
      positionControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onPositionChanged(selectedPosition: any) {
    const positionControl = this.form.get('positionId');
    if (selectedPosition && selectedPosition.id > 0) {
      positionControl?.setValue(selectedPosition.id);
      this.selectedPosition = selectedPosition;
    }
    else {
      this.selectedPosition = null;
      positionControl?.setValue(null);
      positionControl?.markAsTouched();
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
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
        this.form.patchValue({
          province: provinceId,
          provinceName: selectedProvince.name,
        });
      }

      try {
        // Gọi API để lấy danh sách quận/huyện
        const data = await this._employeeService.getDistricts(provinceId).toPromise();
        this.districts = data.districts;

        this.form.get("district")?.enable();
        this.form.get("district")?.setValue(null);

        this.form.get("ward")?.setValue(null);
        this.form.get("ward")?.disable();
      } catch (error) {
        console.error("Lỗi khi tải danh sách quận/huyện:", error);
        this.toastr.error("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
      }
    } else {
      this.form.get("district")?.setValue(null);
      this.form.get("district")?.disable();
      this.form.get("ward")?.setValue(null);
      this.form.get("ward")?.disable();
    }
  }

  async onDistrictChange(event: any) {
    const districtId = event?.code;
    if (districtId) {
      const selectedDistrict = this.districts.find(
        (district) => district.code == districtId
      );

      if (selectedDistrict) {
        this.form.patchValue({
          district: districtId,
          districtName: selectedDistrict.name,
        });
      }

      try {
        const data = await this._employeeService.getWards(districtId).toPromise();
        this.wards = data.wards;

        this.form.get("ward")?.enable();
        this.form.get("ward")?.setValue(null);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phường/xã:", error);
        this.toastr.error("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
      }
    } else {
      this.form.get("ward")?.setValue(null);
      this.form.get("ward")?.disable();
    }
  }

  onWardChange(event: any) {
    const wardId = event?.code;
    if (wardId) {
      const selectedWard = this.wards.find((ward) => ward.code == wardId);
      if (selectedWard) {
        this.form.patchValue({
          ward: wardId,
          wardName: selectedWard.name,
        });
      }
    }
  }

  async filterByBranch(branch: any): Promise<void> {
    this.currentPage = 1;
    this.searchByDepartment = null;

    if (!branch) {
      this.searchByBranch = null;
      this.searchByDepartment = null;
      this.searchByPosition = null;
      this.departmentsArray = [];
      this.positionsArray = [];
    } else {
      this.searchByBranch = branch.id;

      try {
        const data = await this._departmentService
          .getDepartmentByBranch(branch.id)
          .toPromise(); // Chuyển Observable thành Promise để sử dụng await
        this.departmentsArray = data.data || [];
      } catch (error) {
        console.error('Lỗi khi tải danh sách phòng ban:', error);
        this.departmentsArray = [];
      }
    }

    this.fetchEmployeeList();
  }


  async filterByDepartment(department: any): Promise<void> {
    this.currentPage = 1;

    if (!department) {
      this.searchByDepartment = null;
      this.searchByPosition = null;
      this.positionsArray = [];
    } else {
      this.searchByDepartment = department.id;

      try {
        const data = await this._positionService
          .getPositionByDepartmentId(department.id)
          .toPromise(); // Chuyển Observable thành Promise
        this.positionsArray = data.data || [];
      } catch (error) {
        console.error('Lỗi khi tải danh sách vị trí:', error);
        this.positionsArray = [];
      }
    }

    this.fetchEmployeeList(); // Gọi sau khi đảm bảo `positionsArray` đã được cập nhật
  }


  filterByPosition(position: any): void {
    this.currentPage = 1;
    if (!position) {
      this.searchByPosition = null;
      this.positionsArray = [];
    } else {
      this.searchByPosition = position.id;
    }
    this.fetchEmployeeList()
  }

  filterByRole(role: any): void {
    this.currentPage = 1;
    if (!role) {
      this.searchByRole = null;
    } else {
      this.searchByRole = role.id;
    }
    this.fetchEmployeeList()
  }

  onSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.searchByFullName = searchTerm.trim();
    this.fetchEmployeeList()
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchEmployeeList()
  }

  // Hàm thay đổi số bản ghi mỗi trang
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchEmployeeList()
  }

  // Hàm nhận sự kiện sắp xếp từ void-table.component.ts
  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchEmployeeList()
  }

  addEmployee() {
    this.openAddModal(this.modalBasic);
  }

  viewEmployee(data: any) {
    this.openDetailsModal(this.modalView, data);
  }

  editEmployee(data: any) {
    this.openEditModal(this.modalBasic, data);
  }

  deleteEmployee(data: any) {
    this.openDeleteModal(this.modalDelete, data);
  }

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

  fetchEmployeeList(): void {
    this.loading = true;
    this._employeeService
      .filterEmployees(
        this.currentPage,
        this.itemsPerPage,
        this.sortColumn,
        this.sortDirection,
        this.searchByBranch,
        this.searchByDepartment,
        this.searchByPosition,
        this.searchByRole,
        this.searchByFullName
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          this.toastr.error("Lỗi khi tải danh sách nhân viên.");
          console.error("Position Fetch Error:", error);
          return [];
        })
      )
      .subscribe((data: any) => {
        this.employeesArray = data?.data?.items.map((item: any) => {
          return {
            ...item,
            // branchName: item.branch.branchName,
            departmentName: item.department.departmentName,
            positionName: item.position.positionName,
            branchName: item.branch.branchName,
            role: item.user.roleId === 1 ? "Quản trị" : "Nhân Viên",
          };
        });



        this.totalItems = data?.data?.meta.totalItems;
        this.currentPage = data?.data?.meta.currentPage;
        this.itemsPerPage = data?.data?.meta.itemsPerPage;
        this.totalPage = data?.data?.meta.totalPages;
      });
  }

  initialBankList() {
    this.bankList = BANK_LIST.map(bank => ({
      ...bank,
      bankName: `${bank.name} (${bank.code})`, // Định dạng Bank Name theo yêu cầu
    }));
  }

  onSubmitReactiveForm(modal): void {
    this.formLoading = true;
    if (this.form.valid) {
      const formData = this.form.value;
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
      };

      // Chỉ thêm password khi modalMode là "add"
      if (this.modalMode === "add") {
        dataToSend.password = formData.password;
      }
      if (this.modalMode === "add") {
        // Gọi API tạo mới
        this._employeeService.createEmployee(dataToSend).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success("Thêm nhân viên thành công", "Thành công");
              modal.close();
              this.fetchEmployeeList();
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
      } else if (this.modalMode === "edit" && this.selectedEmployee) {
        // Gọi API chỉnh sửa
        this._employeeService
          .updateEmployee(this.selectedEmployee.id, dataToSend)
          .subscribe(
            (response) => {
              this.formLoading = false;
              if (response.code === 200) {
                this.toastr.success(
                  "Chỉnh sửa nhân viên thành công",
                  "Thành công"
                );
                modal.close();
                this.fetchEmployeeList();
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

  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedEmployee = null;
    this.selectedBranch = null;
    this.selectedDepartment = null;
    this.selectedPosition = null;
    this.form.reset();
    this.form.enable();
    this.form.get("password").setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(255),
      Validators.pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/), // Pattern for strong password
    ]);

    this.form.get("password").updateValueAndValidity();
    this.form.get("ward").disable();
    this.form.get("district").disable();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }
  onCloseModal(modal: any): void {
    this.selectedBranch = null;
    this.selectedDepartment = null;
    this.selectedPosition = null;
    this.form.reset(); // Reset toàn bộ form
    this.form.get("ward")?.disable(); // Vô hiệu hóa trường `ward`
    this.form.get("district")?.disable(); // Vô hiệu hóa trường `district`
    this.isDepartmentDisabled = true;
    this.isPositionDisabled = true;
    modal.dismiss("Cross click"); // Đóng modal
    this.isDepartmentDisabled = true;
    this.isPositionDisabled = true;
  }

  async openDetailsOrUpdateModal(
    modalRef,
    employee: any,
    mode: "view" | "edit"
  ): Promise<void> {
    this.modalLoading = true;
    this.modalMode = mode;

    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    try {
      // Gọi API để lấy thông tin nhân viên
      const response: any = await this._employeeService
        .findOneEmployee(employee.id)
        .toPromise();

      if (!response?.data) {
        this.toastr.error(`Không có dữ liệu cho nhân viên ID: ${employee.id}`);
        return;
      }

      this.selectedEmployee = response.data;

      // Chuẩn bị dữ liệu cơ bản
      const detailEmployee = this.prepareDetailEmployee(this.selectedEmployee);
      const locationData = await this.prepareLocationData(this.selectedEmployee);
      Object.assign(detailEmployee, locationData);

      if (mode === "edit") {
        this.isDepartmentDisabled = false;
        this.isPositionDisabled = false;
        this.selectedBranch = this.selectedEmployee.branch;
        this.selectedDepartment = this.selectedEmployee.department;
        this.selectedPosition = this.selectedEmployee.position;
      } else if (mode === "view") {
        this.updateEmployeeFields();
        this.form.disable(); // Khóa form trong chế độ xem
      }

      // Cập nhật form với dữ liệu chi tiết
      this.form.patchValue(detailEmployee);
      this.form.enable();
    } catch (error) {
      console.error("Error fetching employee details:", error);
      this.toastr.error("Lỗi khi tải thông tin nhân viên.");
    } finally {
      this.modalLoading = false; // Tắt trạng thái loading dù thành công hay thất bại
    }
  }

  private prepareDetailEmployee(employee: any): any {
    return {
      fullName: employee.fullName || "",
      specificAddress: employee.specificAddress || "",
      gender: employee.gender || "",
      roleId: employee.user?.roleId || "",
      branchId: employee.branch?.id || "",
      departmentId: employee.department?.id || "",
      positionId: employee.position?.id || "",
      province: null,
      district: null,
      ward: null,
      provinceName: null,
      districtName: null,
      wardName: null,
      email: employee.email || "",
      phoneNumber: employee.phoneNumber || "",
      taxCode: employee.taxCode || "",
      dateOfBirth: employee.dateOfBirth || null,
      idCard: employee.idCard || "",
      accountId: employee.bankAccount?.id || "",
      accountName: employee.bankAccount?.accountName || "",
      accountNumber: employee.bankAccount?.accountNumber || "",
      bankName: employee.bankAccount?.bankName || "",
    };
  }

  private async prepareLocationData(employee: any): Promise<any> {
    const locationData: any = {};

    const selectedProvince = this.provinces.find(
      (province) => province.name === employee.province
    );
    if (selectedProvince) {
      locationData.province = selectedProvince.code;
      locationData.provinceName = selectedProvince.name;

      const districtsResponse = await this._employeeService
        .getDistricts(selectedProvince.code)
        .toPromise();
      this.districts = districtsResponse?.districts || [];

      const selectedDistrict = this.districts.find(
        (district) => district.name === employee.district
      );
      if (selectedDistrict) {
        locationData.district = selectedDistrict.code;
        locationData.districtName = selectedDistrict.name;

        const wardsResponse = await this._employeeService
          .getWards(selectedDistrict.code)
          .toPromise();
        this.wards = wardsResponse?.wards || [];

        const selectedWard = this.wards.find(
          (ward) => ward.name === employee.ward
        );
        if (selectedWard) {
          locationData.ward = selectedWard.code;
          locationData.wardName = selectedWard.name;
        }
      }
    }

    return locationData;
  }


  formatDateToDDMMYYYY(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  updateEmployeeFields(): void {
    this.employeeFields = [
      { label: 'Họ và tên', value: this.selectedEmployee?.fullName },
      { label: 'Giới tính', value: this.selectedEmployee?.gender },
      { label: 'Ngày tháng năm sinh', value: this.formatDateToDDMMYYYY(this.selectedEmployee?.dateOfBirth) },
      {
        label: 'Địa chỉ',
        value: this.selectedEmployee
          ? [
            this.selectedEmployee?.specificAddress || '',
            this.selectedEmployee?.ward || '',
            this.selectedEmployee?.district || '',
            this.selectedEmployee?.province || '',
          ]
            .filter((part) => part.trim() !== '') // Loại bỏ các giá trị rỗng hoặc chỉ chứa khoảng trắng
            .join(', ') // Nối các phần còn lại bằng dấu phẩy
          : '',
      },

      { label: 'Chi nhánh', value: this.selectedEmployee?.branch?.branchName },
      { label: 'Phòng ban', value: this.selectedEmployee?.department?.departmentName },
      { label: 'Chức vụ', value: this.selectedEmployee?.position?.positionName },
      { label: 'Email', value: this.selectedEmployee?.email },
      { label: 'Số điện thoại', value: this.selectedEmployee?.phoneNumber },
      { label: "Số tài khoản", value: `${this.selectedEmployee?.bankAccount.accountNumber} - ${this.selectedEmployee?.bankAccount.bankName} - ${this.selectedEmployee?.bankAccount.accountName}` },
    ];
  }

  openDetailsModal(modalRef, employee: any): void {
    this.openDetailsOrUpdateModal(modalRef, employee, "view");
  }

  openEditModal(modalRef, employee: any): void {
    this.openDetailsOrUpdateModal(modalRef, employee, "edit");
  }

  openDeleteModal(modalRef, employee?: any): void {
    if (employee) {
      this.deletedIds = [employee.id];
      this.selectedEmployee = employee;
    } else {
      this.selectedEmployee = null;
    }
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  deleteSelectedEmployees(modal): void {
    this.deleteLoading = true;
    this._employeeService.deleteEmployee(this.deletedIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.deleteLoading = false;
          this.toastr.success("Xóa nhân viên thành công");
          this.fetchEmployeeList();
          this.selectedIds = [];
          this.deletedIds = [];
          modal.close();
        } else {
          this.deleteLoading = false;
          this.toastr.error("Xóa nhân viên thất bại");
          modal.close();
        }
      },
      (error) => {
        this.deleteLoading = false;
        console.error("Có lỗi xảy ra khi xóa nhân viên", error);
      }
    );
  }

  async getBranches() {
    try {
      const data = await this._branchService.getAllBranches().toPromise();
      const addOption = { id: 0, branchName: '+ Thêm mới chi nhánh' };
      this.branches = [addOption, ...data.data];
      this.branchsArray = data.data;
    } catch (error) {
      console.error("Có lỗi khi tải danh sách chi nhánh:", error);
      this.toastr.error("Không thể tải danh sách chi nhánh. Vui lòng thử lại.");
    }
  }


  ngOnInit(): void {
    this.fetchEmployeeList()
    this.getBranches();
    this.initialBankList();
    this._employeeService.getProvinces().subscribe((response) => {
      this.provinces = response;
    });

    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._employeeService.onEmployeeListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
          }, 450);
        } else {
          this._employeeService.onEmployeeListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
              this.rows = response;
              this.tempData = this.rows;
            });
        }
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
