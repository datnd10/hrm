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
import { catchError, finalize, takeUntil } from "rxjs/operators";
import { PositionService } from "../position/position.service";
import {
  endDateAfterStartDateValidator,
} from "common/validation";
import { BranchService } from "../branch/branch.service";
import { DepartmentService } from "../department/department.service";
import { ContractService } from "./contract.service";
import { EmployeeService } from "../employee/employee.service";


@Component({
  selector: "app-contract",
  templateUrl: "./contract.component.html",
  styleUrls: ["./contract.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ContractComponent implements OnInit {
  // Public
  public temp = [];
  public rows: any[] = [];
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public branches: any = [];
  public modalMode: "add" | "edit" | "view" = "add";
  public selectedContract: any = null;
  public selectedIds = [];
  public deletedIds = [];
  public SelectionType = SelectionType;
  public selectedRows: any[] = [];
  public departments: any = [];
  public employees: any = [];
  public selectedItems: any[] = [];

  public genders = [
    { id: 1, name: "Nam" },
    { id: 2, name: "Nữ" },
    { id: 3, name: "Khác" },
  ];

  public statusFilter = [
    { name: "Hoạt động", value: "ACTIVE" },
    { name: "Không hoạt động", value: "INACTIVE" },
  ];

  public basicDateOptions: FlatpickrOptions = {
    altInput: true,
  };
  formErrors: { [key: string]: string[] } = {};
  public basicDPdata: NgbDateStruct;

  tableTitle: string = "Quản lý hợp đồng";
  contractsArray: any[] = [];
  columnArray: any[] = [
    {
      header: "Tên hợp đồng",
      fieldName: "contractName",
      dataType: "string",
      width: "500px",
    },
    {
      header: "Họ tên",
      fieldName: "fullName",
      dataType: "string",
      width: "500px",
    },
    {
      header: "Lương",
      fieldName: "salary",
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
    {
      header: "Trạng thái",
      fieldName: "status",
      dataType: "string",
      width: "500px",
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

  searchByPosition: string;
  searchByDepartment: string;
  searchByBranch: string;
  searchByFullName: string;
  searchByStatus: string;

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

  contractFields: Array<{ label: string; value: string | null }> = [];

  public selectedBranch: any = null;
  public selectedDepartment: any = null;
  public selectedEmployee: any = null;
  public isDepartmentDisabled = true;
  public isEmployeeDisabled = true;


  constructor(
    private _contractService: ContractService,
    private _branchService: BranchService,
    private _departmentService: DepartmentService,
    private _positionService: PositionService,
    private _employeeService: EmployeeService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.initializeForm();
  }
  isActive: boolean = false; // Initial state

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
    const employeeControl = this.form.get('employeeId');
    if (selectedBranch && selectedBranch.id > 0) {
      branchControl?.setValue(selectedBranch.id);
      this.selectedBranch = selectedBranch;
      this.selectedDepartment = null;
      this.selectedEmployee = null;
      this.isDepartmentDisabled = false;
    }
    else {
      this.selectedBranch = null;
      this.selectedDepartment = null;
      this.selectedEmployee = null;
      branchControl?.setValue(null);
      branchControl?.markAsTouched();
      departmentControl?.setValue(null);
      departmentControl?.markAsTouched();
      employeeControl?.setValue(null);
      employeeControl?.markAsTouched();
      this.isDepartmentDisabled = true;
      this.isEmployeeDisabled = true;
    }
  }

  onDepartmentAdded(newDepartment: any): void {
    if (this.selectedBranch && this.selectedBranch.id > 0 && newDepartment.branch.id === this.selectedBranch.id) {
      this.form.get('departmentId').setValue(newDepartment.id);
      this.selectedDepartment = newDepartment;
      this.isEmployeeDisabled = false;
    }
    else {
      this.selectedDepartment = null;
      this.form.get('departmentId').setValue(null);
      this.isEmployeeDisabled = true;
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
    const employeeControl = this.form.get('employeeId');
    if (selectedDepartment && selectedDepartment.id > 0) {
      departmentControl?.setValue(selectedDepartment.id);
      this.selectedDepartment = selectedDepartment;
      this.selectedEmployee = null;
      this.isEmployeeDisabled = false;
    }
    else {
      this.selectedDepartment = null;
      this.selectedEmployee = null;
      departmentControl?.setValue(null);
      departmentControl?.markAsTouched();
      employeeControl?.setValue(null);
      employeeControl?.markAsTouched();
      this.isEmployeeDisabled = true;
    }
  }

  onEmployeeAdded(newEmployee: any): void {

    if (this.selectedDepartment && this.selectedDepartment.id > 0 && newEmployee.department.id === this.selectedDepartment.id) {
      this.form.get('employeeId').setValue(newEmployee.id);
      this.selectedEmployee = newEmployee;
    }
    else {
      this.selectedEmployee = null;
      this.form.get('employeeId').setValue(null);
    }
  }

  onEmployeeBlurred(): void {
    const employeeControl = this.form.get('employeeId');
    if (!employeeControl?.value) {
      employeeControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onEmployeeChanged(selectedEmployee: any) {
    const employeeControl = this.form.get('employeeId');
    if (selectedEmployee && selectedEmployee.id > 0) {
      employeeControl?.setValue(selectedEmployee.id);
      this.selectedEmployee = selectedEmployee;
    }
    else {
      this.selectedEmployee = null;
      employeeControl?.setValue(null);
      employeeControl?.markAsTouched();
    }
  }

  onToggle(): void {
    const currentStatus = this.form.get("status")?.value;
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    this.isActive = newStatus === "ACTIVE"; // Update the isActive state
    this.form.patchValue({ status: newStatus }); // Update the form control value for status
  }
  formatCurrency(value: number | string): string {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value));
  }
  initializeForm(): void {
    this.form = this.fb.group({
      contractName: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: ["", Validators.maxLength(300)],
      startDate: ["", [Validators.required]],
      endDate: ["", [endDateAfterStartDateValidator("startDate")]],
      salary: ["", [Validators.required, Validators.min(0), Validators.pattern("^[0-9.]*$")]],
      branchId: [null, Validators.required],
      departmentId: [{ value: null }, Validators.required],
      employeeId: [{ value: null }, Validators.required],
      status: ["ACTIVE"],
    });
  }

  async fetchDepartmentsByBranch(branchId: string): Promise<void> {
    try {
      const departmentResponse: any = await this._departmentService
        .getDepartmentByBranch(+branchId)
        .toPromise();
      this.departmentsArray = departmentResponse?.data || [];
      // Gán dữ liệu vào departments
      this.departments = departmentResponse?.data || [];
    } catch (error) {
      console.error("Có lỗi khi tải danh sách phòng ban:", error);
      this.toastr.error("Lỗi khi tải danh sách phòng ban.");
    }
  }

  async fetchPositionsByDepartment(departmentId: string): Promise<void> {
    try {
      const positionResponse: any = await this._positionService
        .getPositionByDepartmentId(+departmentId)
        .toPromise();

      // Gán dữ liệu vào departments
      this.positionsArray = positionResponse?.data || [];
    } catch (error) {
      console.error("Có lỗi khi tải danh sách phòng ban:", error);
      this.toastr.error("Lỗi khi tải danh sách phòng ban.");
    }
  }

  /** Tim kiem theo chi nhanh */
  async filterByBranch(branch: any): Promise<void> {
    this.currentPage = 1;
    if (!branch) {
      this.searchByBranch = null;
      this.searchByDepartment = null;
      this.searchByPosition = null;
      this.departmentsArray = [];
      this.positionsArray = [];
    } else {
      this.searchByBranch = branch.id;
      this.searchByDepartment = null;
      this.searchByPosition = null;
      await this.fetchDepartmentsByBranch(branch.id);
    }

    this.fetchContract()
  }

  /** Tim kiem theo phong ban */
  async filterByDepartment(department: any): Promise<void> {
    this.currentPage = 1;
    if (!department) {
      this.searchByDepartment = null;
      this.searchByPosition = null;
      this.positionsArray = [];
    } else {
      this.searchByDepartment = department.id;
      this.searchByPosition = null;
      await this.fetchPositionsByDepartment(department.id);
    }
    this.fetchContract()
  }

  /** Tim kiem theo chuc vu */
  filterByPosition(position: any): void {
    this.currentPage = 1;
    if (!position) {
      this.searchByPosition = null;
      // this.positionsArray = [];
    } else {
      this.searchByPosition = position.id;
    }
    this.fetchContract()
  }

  /** Tim kiem theo trang thai */
  filterByStatus(status: any): void {
    this.currentPage = 1;
    if (!status) {
      this.searchByStatus = null;
    } else {
      this.searchByStatus = status.value;
    }
    this.fetchContract()
  }

  /** Tim kiem theo ho ten */
  onSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.searchByFullName = searchTerm.trim();

    this.fetchContract()
  }

  /**Hàm thay đổi trang */
  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchContract()
  }

  /**Hàm thay đổi số bản ghi mỗi trang */
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchContract()
  }

  /** hàm sort */
  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchContract()
  }

  /**Hàm nhận hành động mở add modal từ bên table */
  addContract() {
    this.openAddModal(this.modalAddEdit);
  }

  /** Hàm nhận hành động mở modal view từ bên table */
  viewContract(data: any) {
    this.openDetailsModal(this.modalView, data);
  }

  /** Hàm nhận hành động mở modal edit từ bên table */
  editContract(data: any) {
    this.openEditModal(this.modalAddEdit, data);
  }

  /**Hàm nhận hành động mở modal từ bên table */
  deleteContract(data: any) {
    this.openDeleteModal(this.modalDelete, data);
  }

  /** Hàm nhận hành động mở modal delete từ bên table */
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

  /** Hàm mở modal add */
  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedContract = null;
    this.selectedBranch = null;
    this.selectedDepartment = null;
    this.selectedEmployee = null;
    this.form.reset();
    this.form.enable();
    this.isDepartmentDisabled = true;
    this.isEmployeeDisabled = true;
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }
  /** Hàm đóng modal */
  onCloseModal(modal: any): void {
    this.selectedBranch = null;
    this.selectedDepartment = null;
    this.selectedEmployee = null;
    this.form.reset(); // Reset toàn bộ form
    this.isDepartmentDisabled = true;
    this.isEmployeeDisabled = true;
    modal.dismiss("Cross click"); // Đóng modal
  }

  removeFormatting(value: string): number {
    return Number(value.replace(/[^0-9]/g, "")); // Loại bỏ ký tự không phải số
  }


  async openDetailsOrUpdateModal(
    modalRef,
    contract: any,
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
      // Gọi API để lấy thông tin position
      const response: any = await this._contractService.getOneContract(contract.id).toPromise();

      if (response?.data) {
        this.selectedContract = response.data;

        if (mode === "edit") {
          this.isDepartmentDisabled = false;
          this.isEmployeeDisabled = false;
          this.selectedBranch = this.selectedContract.branch;
          this.selectedDepartment = this.selectedContract.department;
          this.selectedEmployee = this.selectedContract.employee;
          let object = {
            contractName: this.selectedContract.contractName,
            salary: this.formatCurrency(this.selectedContract.salary),
            startDate: new Date(this.selectedContract.startDate)
              .toISOString()
              .split("T")[0], // Ensure correct format
            endDate: this.selectedContract.endDate
              ? new Date(this.selectedContract.endDate).toISOString().split("T")[0]
              : null,
            description: this.selectedContract.description,
            branchId: this.selectedContract.branch.id,
            departmentId: this.selectedContract.department.id,
            employeeId: this.selectedContract.employee.id,
            status: this.selectedContract.status,
          };

          this.form.patchValue(object);
          this.form.enable(); // Cho phép chỉnh sửa
        } else if (mode === "view") {
          this.updateContractFields(); // Hiển thị thông tin view
          this.form.disable(); // Khóa form trong chế độ xem
        }
      } else {
        this.toastr.error(`Không có dữ liệu cho hợp đồng ID: ${contract.id}`);
      }
    } catch (error) {
      console.error("Error fetching position details:", error);
      this.toastr.error("Lỗi khi tải thông tin hợp đồng.");
    } finally {
      this.modalLoading = false; // Đảm bảo luôn tắt modalLoading
    }

    // Mở modal ngay lập tức và hiển thị trạng thái loading bên trong modal

  }



  updateContractFields(): void {
    this.contractFields = [
      { label: 'Chi nhánh', value: this.selectedContract?.branch?.branchName || 'Chưa có dữ liệu' },
      { label: 'Phòng ban', value: this.selectedContract?.department?.departmentName || 'Chưa có dữ liệu' },
      { label: 'Nhân viên', value: this.selectedContract?.employee?.fullName || 'Chưa có dữ liệu' },
      { label: 'Tên hợp đồng', value: this.selectedContract?.contractName || 'Chưa có dữ liệu' },
      { label: 'Lương', value: `${this.formatCurrency(this.selectedContract?.salary)} đ` || 'Chưa có dữ liệu' },
      {
        label: 'Ngày bắt đầu',
        value: this.selectedContract?.startDate
          ? this.formatDate(this.selectedContract.startDate)
          : 'Chưa có dữ liệu'
      },
      {
        label: 'Ngày kết thúc',
        value: this.selectedContract?.endDate
          ? this.formatDate(this.selectedContract.endDate)
          : 'Chưa có dữ liệu'
      },
      { label: 'Mô tả', value: this.selectedContract?.description || 'Chưa có dữ liệu' },
      {
        label: 'Trạng thái',
        value: this.selectedContract?.status === 'ACTIVE'
          ? 'Hoạt động'
          : this.selectedContract?.status === 'INACTIVE'
            ? 'Không hoạt động'
            : 'Chưa có dữ liệu'
      },
    ];
  }

  // Helper function to format date
  // Helper function to format date (only day/month/year)
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }



  openDetailsModal(modalRef, contract: any): void {
    this.openDetailsOrUpdateModal(modalRef, contract, "view");
  }

  openEditModal(modalRef, contract: any): void {
    this.openDetailsOrUpdateModal(modalRef, contract, "edit");
  }

  /**hàm mở model delete */
  openDeleteModal(modalRef, contract?: any): void {
    if (contract) {
      this.deletedIds = [contract.id];
      this.selectedContract = contract;
    } else {
      this.selectedContract = null;
    }
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  // hàm call api delete
  deleteselectedContracts(modal): void {
    this.deleteLoading = true;
    this._contractService.deleteContract(this.deletedIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.deleteLoading = false;
          this.toastr.success("Xóa hợp đồng thành công");
          this.fetchContract();
          this.selectedIds = [];
          this.deletedIds = [];
          modal.close();
        } else {
          this.deleteLoading = false;
          this.toastr.error("Xóa hợp đồng thất bại");
          modal.close();
        }
      },
      (error) => {
        this.deleteLoading = false;
        console.error("Có lỗi xảy ra khi xóa hợp đồng", error);
      }
    );
  }

  /**Hàm tải dữ liệu hợp đồng */
  fetchContract(): void {
    this.loading = true;
    this._contractService
      .filterContracts(
        this.currentPage,
        this.itemsPerPage,
        this.sortColumn,
        this.sortDirection,
        this.searchByBranch,
        this.searchByDepartment,
        this.searchByPosition,
        this.searchByStatus,
        this.searchByFullName
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          this.toastr.error("Lỗi khi tải danh sách hợp đồng");
          console.error("Position Fetch Error:", error);
          return [];
        })
      )
      .subscribe((data: any) => {
        this.contractsArray = data?.data?.items.map((item: any) => {
          return {
            ...item,
            fullName: item.employee.fullName,
            departmentName: item.department.departmentName,
            positionName: item.position.positionName,
            branchName: item.branch.branchName,
          };
        });

        this.totalItems = data?.data?.meta.totalItems;
        this.currentPage = data?.data?.meta.currentPage;
        this.itemsPerPage = data?.data?.meta.itemsPerPage;
        this.totalPage = data?.data?.meta.totalPages;
      });
  }



  /**Hàm thay đổi các phòng ban khi crud */

  /**hàm submit */
  onSubmitReactiveForm(modal): void {
    this.formLoading = true;

    if (this.form.valid) {
      const formData = this.form.value;
      const dataToSend: any = {
        ...(formData.contractName && { contractName: formData.contractName }),
        ...(formData.startDate && { startDate: formData.startDate }),
        ...(formData.endDate && { endDate: formData.endDate }),
        ...(formData.salary && { salary: this.removeFormatting(formData.salary) }),
        ...(formData.employeeId && { employeeId: formData.employeeId }),
        ...(formData.description && { description: formData.description }),
        ...(formData.status && { status: formData.status }),
      };

      if (this.modalMode === "add") {
        // Gọi API tạo mới
        this._contractService.createContract(dataToSend).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success("Thêm hợp đồng thành công", "Thành công");
              modal.close();
              this.fetchContract();
              this.form.reset();
            } else {
              this.toastr.error(response.message, "Lỗi");
              this.displayApiErrors(response.message);
            }
          },
          (error) => {
            this.formLoading = false;
            console.error("Có lỗi xảy ra khi thêm mới", error);
          }
        );
      } else if (this.modalMode === "edit" && this.selectedContract) {
        // Gọi API chỉnh sửa
        this._contractService
          .updateContract(this.selectedContract.id, dataToSend)
          .subscribe(
            (response) => {
              this.formLoading = false;
              if (response.code === 200) {
                this.toastr.success(
                  "Chỉnh sửa hợp đồng thành công",
                  "Thành công"
                );
                modal.close();
                this.fetchContract();
                this.form.reset();
              } else {
                this.toastr.error(response.message, "Lỗi");
                this.displayApiErrors(response.message);
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

  /** hàm hiển thị lỗi từ backend */
  displayApiErrors(apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (this.form.controls[err.field]) {
        this.form.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  /**Lấy ra các branch */
  getBranches() {
    this._branchService
      .getAllBranches()
      .toPromise()
      .then((data) => {
        this.branches = data.data;
        this.branchsArray = data.data;
      })
      .catch((error) => {
        console.error("Có lỗi khi tải danh sách chi nhánh", error);
        // this.loading = false;
      });
  }

  ngOnInit(): void {
    this.fetchContract()
    this.getBranches();

    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._contractService.onContractListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
          }, 450);
        } else {
          this._contractService.onContractListChanged
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
