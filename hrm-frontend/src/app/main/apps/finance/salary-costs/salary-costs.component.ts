import { Component, HostListener, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import {
  ColumnMode,
  DatatableComponent,
  SelectionType,
} from "@swimlane/ngx-datatable";
import { FlatpickrOptions } from "ng2-flatpickr";
import { Subject } from "rxjs";
import { ExpenseService } from "../expense/expense.service";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { CoreConfigService } from "@core/services/config.service";
import { ToastrService } from "ngx-toastr";
import { catchError, finalize, takeUntil } from "rxjs/operators";
import { Expense } from "shared/models/expense.model";
import { DepartmentService } from "../../hrm-setting/department/department.service";
import { BranchService } from "../../hrm-setting/branch/branch.service";
import { EmployeeService } from "../../hrm-setting/employee/employee.service";
import { ExpenseTypeService } from "../expense-type/expense-type.service";
import { nonEmptyArrayValidator } from "common/validation";
import { SalaryCostsService } from "./salary-costs.service";
import { AccountListService } from "../account-list/account-list.service";
import { ContractService } from "../../hrm-setting/contract/contract.service";
@Component({
  selector: "app-salary-costs",
  templateUrl: "./salary-costs.component.html",
  styleUrls: ["./salary-costs.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class SalaryCostsComponent implements OnInit {
  // Public
  public temp = [];
  public rows: any[] = [];
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public departments: any = [];
  public branches: any = [];
  public employees: any = [];
  public modalMode: "add" | "edit" | "view" = "add";
  public selectedExpense: any = null;
  public selectedIds = [];
  public SelectionType = SelectionType;
  public bankAccounts: any[] = []; // Danh sách tài khoản ngân hàng
  actionType: "delete" | "approve" | "reject";
  actionImportExport: "import" | "export";
  selectedExpenseTypeModal: any;
  selectedExpenseDate: string; // Dùng để lưu ngày thực chi từ modal
  selectedSourceAccount: string; // Dùng để lưu tài khoản nguồn từ modal
  isMonthPickerOpen = false;
  selectedMonthYearFilter: Date | null = null;
  selectedMonthYearModal: Date | null = new Date();
  selectedMonthYearTemplate: Date | null = new Date();
  public selectedItems: any[] = [];



  public basicDateOptions: FlatpickrOptions = {
    altInput: true,
  };
  formErrors: { [key: string]: string[] } = {};

  statusOptions: any[] = [
    { name: "Chưa duyệt", value: "PENDING" },
    { name: "Đã duyệt", value: "APPROVED" },
    { name: "Từ chối", value: "REJECTED" },
  ];

  showElement: boolean = true;

  searchByName: string = "";
  searchByStatus: string = null;
  searchByEmployee: string = null;

  selectedBranchImportExport: any = null;

  expenseArray: any[] = [];
  tableTitle: string = "Quản lý lương";
  columnArray: any[] = [
    {
      header: "Chi phí",
      fieldName: "expenseName",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Kỳ thanh toán",
      fieldName: "billingCycle",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Chi nhánh",
      fieldName: "branchName",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Tài Khoản Nguồn",
      fieldName: "sourceAccountName",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Tổng tiền",
      fieldName: "totalAmount",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Người thụ hưởng",
      fieldName: "employeeName",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Ngày chi",
      fieldName: "date",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Trạng thái",
      fieldName: "status",
      dataType: "string",
    },
  ];

  totalItems: number = 0; // Tổng số bản ghi (lấy từ API)
  itemsPerPage: number = 10; // Số bản ghi mỗi trang
  currentPage: number = 1; // Trang hiện tại
  totalPage: number = 0; // Tổng số trang

  sortColumn: string = "createdAt"; // Cột sắp xếp mặc định
  sortDirection: string = "DESC"; // Hướng sắp xếp mặc định

  totalItemsExpenseTypes: number = 0; // Tổng số bản ghi (lấy từ API)
  itemsPerPageExpenseTypes: number = 10; // Số bản ghi mỗi trang
  currentPageExpenseTypes: number = 1; // Trang hiện tại
  totalPageExpenseTypes: number = 0; // Tổng số trang

  sortColumnExpenseTypes: string = "createdAt"; // Cột sắp xếp mặc định
  sortDirectionExpenseTypes: string = "DESC"; // Hướng sắp xếp mặc định

  branchsArray: any[] = [];
  departmentsArray: any[] = [];
  employeesArray: any[] = [];

  @ViewChild("modalBasic") modalBasic: any;
  @ViewChild("modal") modal: any;
  @ViewChild("modalImportExportService") modalImportExportService: any;
  @ViewChild("salaryModal") salaryModal: any;
  @ViewChild("deductionModal") deductionModal: any;
  @ViewChild("changeStatus") modalChangeStatus: any;

  private modalRefExpenseType: NgbModalRef;

  // Decorator
  @ViewChild(DatatableComponent) table: DatatableComponent;

  categoryOptions: any[] = [
    { name: "Lương", value: true },
    { name: "Chi phí khác", value: false },
  ];

  searchByCategory: string = null;
  searchByExpenseTypeName: string = "";

  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;
  private form: FormGroup;
  public loading: boolean = true;
  public formLoading: boolean = false;
  public modalLoading: boolean = false;
  public deleteLoading: boolean = false;
  public selectedExpenseType: any = null;
  public expenseTypes: any = [];
  public expenseTypesArray = [];
  public cols: any[];

  public selectedExpenseTypes = []; // Danh sách chính thức các chi phí được chọn sau khi bấm nút "Chọn"
  public selectedSalaryItemsFromChild: any[] = [];
  public selectedDeductionItemsFromChild: any[] = [];
  public searchByBranch: string;
  public billingCycle: string;
  public billingCycleTemplate: string;

  public loadingExpenseType: boolean = false;
  selectedFile: File | null = null;
  isUploading = false;

  public selectedBranch: any = null;
  public selectedDepartment: any = null;
  public selectedEmployee: any = null;
  public isDepartmentDisabled = true;
  public isEmployeeDisabled = true;
  public isBranchDisabled = false;
  public isMonthDisabled = false;

  constructor(
    private _accountListService: AccountListService,
    private _salaryCostsService: SalaryCostsService,
    private _expenseService: ExpenseService,
    private _branchService: BranchService,
    private _departmentService: DepartmentService,
    private _contractService: ContractService,
    private _employeeService: EmployeeService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private _expenseTypeService: ExpenseTypeService
  ) {
    this._unsubscribeAll = new Subject();
    this.initializeForm();
    this.billingCycleTemplate = this.getBillingCycleFormat(new Date());
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
      this.getSalaryFromContract();
    }
    else {
      this.selectedEmployee = null;
      employeeControl?.setValue(null);
      employeeControl?.markAsTouched();
    }
  }

  async getSalaryFromContract() {
    try {
      // Gọi API để lấy dữ liệu hợp đồng
      const response: any = await this._contractService.getContractByEmployee(this.selectedEmployee.id).toPromise();
      const baseSalary = response.data.salary;

      // Lấy FormArray salaryItems
      const salaryItemsFormArray = this.form.get('salaryItems') as FormArray;

      if (salaryItemsFormArray && salaryItemsFormArray.controls.length > 0) {

        salaryItemsFormArray.controls.forEach((group: AbstractControl) => {
          const formulaType = group.get('formulaType')?.value;
          const price = group.get('price')?.value;

          if (formulaType === 'BASE_SALARY' && price == null) {
            // Nếu formulaType là 'BASE_SALARY', gán giá trị tiền lương từ hợp đồng
            group.get('price')?.setValue(this.formatCurrency(baseSalary), { emitEvent: false }); // Gán giá trị lương
            group.get('quantity')?.setValue(1, { emitEvent: false }); // Đặt số lượng là 1 (nếu cần)
            group.get('baseQuantity')?.setValue(1, { emitEvent: false }); // Đặt số lương cơ bản la 1 (nếu cần)
          }
        });

        // Bật lại valueChanges sau khi cập nhật
        // this.form.get('salaryItems')?.enable({ emitEvent: false });
      } else {
        console.warn('Không có item nào trong salaryItems để xử lý.');
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu từ hợp đồng:', error);
    }
  }


  onBranchImportExportChange(selectedBranchImportExport: any) {
    this.selectedBranchImportExport = selectedBranchImportExport
      ? { branchName: selectedBranchImportExport.branchName, value: selectedBranchImportExport.id }
      : { branchName: "Tất cả chi nhánh", value: "all" };

  }

  getBillingCycleFormat(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${year}`;
  }

  updateBillingCycle(date: Date | null, mode: 'filter' | 'modal' | 'template') {
    const billingCycle = date
      ? `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`
      : null;

    switch (mode) {
      case 'filter':
        this.selectedMonthYearFilter = date;
        this.billingCycle = billingCycle;
        this.fetchExpense(); // Gọi hàm fetch dữ liệu
        break;

      case 'modal':
        this.selectedMonthYearModal = date;
        this.form.get('billingCycle')?.setValue(billingCycle);
        this.form.get('expenseName')?.setValue(billingCycle ? `Trả lương tháng ${billingCycle}` : null);
        break;

      case 'template':
        this.selectedMonthYearTemplate = date;
        this.billingCycleTemplate = billingCycle;
        break;

      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      expenseName: ["Trả lương tháng " + this.getBillingCycleFormat(new Date()), Validators.required],
      billingCycle: [this.getBillingCycleFormat(new Date()), Validators.required],
      taxRate: [10, [Validators.min(0), Validators.max(100)]],
      branchId: [null, Validators.required],
      departmentId: [null],
      salaryItems: this.fb.array([], nonEmptyArrayValidator()),
      deductionItems: this.fb.array([]),
      preTaxAmount: [{ value: 0, disabled: true }], // Tiền trước thuế
      postTaxAmount: [{ value: 0, disabled: true }], // Tiền sau thuế
    });
    this.setupListeners();
  }

  updateAmounts(): void {
    const salaryItems = this.form.get('salaryItems')?.value || [];
    const deductionItems = this.form.get('deductionItems')?.value || [];
    const taxRate = this.form.get('taxRate')?.value || 0;

    // Hàm tính tổng cho salary hoặc deduction
    const calculateTotal = (items: any[]): number => {
      return items.reduce((sum, item) => {
        if (!item.quantity || item.quantity <= 0) {
          return sum; // Bỏ qua nếu không có số lượng
        }

        switch (item.formulaType) {
          case 'BASE_SALARY':
            if (item.baseQuantity > 0) {
              return sum + (item.quantity * this.removeFormatting(item.price)) / item.baseQuantity;
            }
            return sum;

          case 'FIXED_COST':
          case 'VARIABLE_COST':
            return sum + item.quantity * this.removeFormatting(item.price);

          case 'TIERED_COST':
            if (item.expenseRanges && item.expenseRanges.length > 0) {
              return sum + this.calculateTieredCost(item.quantity, item.expenseRanges);
            }
            return sum;

          default:
            return sum;
        }
      }, 0);
    };

    // Tính tổng lương trước thuế
    const preTaxSalary = calculateTotal(salaryItems);
    const totalDeductions = calculateTotal(deductionItems);

    // Tính tiền trước thuế
    const preTaxAmount = preTaxSalary - totalDeductions;

    // Tính thuế và tiền sau thuế
    const taxAmount = (preTaxAmount * taxRate) / 100;
    const postTaxAmount = preTaxAmount - taxAmount;

    // Cập nhật giá trị vào form
    this.form.patchValue({
      preTaxAmount: preTaxAmount > 0 ? this.formatCurrency(preTaxAmount) : 0,
      postTaxAmount: postTaxAmount > 0 ? this.formatCurrency(postTaxAmount) : 0,
    });
  }

  setupListeners(): void {
    // Khi trường "taxRate" thay đổi, tính toán lại
    this.form.get('taxRate')?.valueChanges.subscribe(() => {
      this.updateAmounts();
    });

    // Khi "salaryItems" hoặc "deductionItems" thay đổi, tính toán lại
    this.form.get('salaryItems')?.valueChanges.subscribe(() => {
      this.updateAmounts();
    });
    this.form.get('deductionItems')?.valueChanges.subscribe(() => {
      this.updateAmounts();
    });
  }

  removeFormatting(value: string): number {
    return Number(value.replace(/[^0-9]/g, "")); // Loại bỏ ký tự không phải số
  }

  calculateTotalAmount(
    formulaType: string,
    price: string,
    quantity: number,
    baseQuantity: number,
    expenseRanges: any[]
  ): number {
    let total = 0;

    switch (formulaType) {
      case 'BASE_SALARY':
        if (quantity && baseQuantity) {
          total = (quantity * this.removeFormatting(price)) / baseQuantity;
        }
        break;

      case 'FIXED_COST':
        if (quantity && price) {
          total = quantity * this.removeFormatting(price);
        }
        break;

      case 'TIERED_COST':
        if (quantity && expenseRanges?.length) {
          total = this.calculateTieredCost(quantity, expenseRanges);
        }
        break;

      case 'VARIABLE_COST':
        if (quantity && price) {
          total = quantity * this.removeFormatting(price);
        }
        break;

      default:
        total = 0;
    }

    return total;
  }

  calculateTieredCost(quantity: number, expenseRanges: any[]): number {
    let total = 0;

    // Sắp xếp các khoảng chi phí theo minRange
    const sortedRanges = expenseRanges.sort((a, b) => a.minRange - b.minRange);

    for (const range of sortedRanges) {
      if (quantity <= 0) {
        break;
      }

      const rangeQuantity = Math.min(quantity, range.maxRange - range.minRange + 1);
      total += rangeQuantity * range.price;
      quantity -= rangeQuantity;
    }
    return total;
  }

  get salaryItems(): FormArray {
    return this.form.get("salaryItems") as FormArray;
  }

  get deductionItems(): FormArray {
    return this.form.get("deductionItems") as FormArray;
  }

  getItemsArray(type: string): FormArray {
    return type === "SALARY" ? this.salaryItems : this.deductionItems;
  }

  conditionalRequiredValidator(condition: () => boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (condition() && (control.value === null || control.value === '')) {
        return { required: true };
      }
      return null;
    };
  }

  addExpenseItem(type: string, expenseType: any): void {
    if (this.selectedEmployee) {
      this.getSalaryFromContract();
    }
    const expenseItemForm = this.fb.group({
      expenseTypeId: [expenseType.id, Validators.required],
      expenseItemName: [expenseType.name || ''],
      formulaType: [expenseType.formulaType || ''],
      quantity: [null, [Validators.required, Validators.min(1)]],
      price: [this.formatCurrency(expenseType.basePrice) || null, this.conditionalRequiredValidator(() => expenseType.formulaType !== 'TIERED_COST')],
      baseQuantity: [0, [Validators.min(0)]],
      taxRate: [0, [Validators.min(0), Validators.max(100)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      expenseRanges: [expenseType.expenseRanges || []],
    });
    this.getItemsArray(type).push(expenseItemForm);
  }

  removeExpenseItem(type: string, index: number): void {
    this.getItemsArray(type).removeAt(index);
  }

  handleSendSelectedItems(type: string, selectedExpenseItems: any[]): void {
    selectedExpenseItems.forEach((expenseType) => {
      const expenseTypeId = expenseType.id;

      const exists = this.getItemsArray(type).controls.some(
        (control) => control.value.expenseTypeId === expenseTypeId
      );

      if (!exists) {
        this.addExpenseItem(type, expenseType);
      }
    });
  }

  async onSelectedItemsFromChild(type: string, selectedItems: any[]): Promise<void> {
    try {
      // Gọi API cho từng item trong selectedItems
      const itemsWithDetails = await Promise.all(
        selectedItems.map(async (item) => {
          // Gọi API getOneExpenseType cho từng item
          const response = await this._expenseTypeService.getOneExpenseType(item.id).toPromise();

          // Đảm bảo lấy ra mảng các item
          return response.data;
        })
      );

      // Gán kết quả vào mảng tương ứng
      if (type === "SALARY") {
        this.selectedSalaryItemsFromChild = itemsWithDetails; // Gộp các mảng con thành một mảng duy nhất
      } else if (type === "DEDUCTION") {
        this.selectedDeductionItemsFromChild = itemsWithDetails;
      }
    } catch (error) {
      console.error("Lỗi khi gọi API getOneExpenseType:", error);
    }
  }

  onConfirmExpenseTypeModal(type: string, modal: any): void {
    const selectedItems =
      type === "SALARY"
        ? this.selectedSalaryItemsFromChild
        : this.selectedDeductionItemsFromChild;

    this.handleSendSelectedItems(type, selectedItems);
    modal.close();
  }

  onCloseExpenseTypeModal(modal: any): void {
    this.formLoading = false;
    modal.dismiss("Cross click");
  }

  onOpenExpenseTypeModal(modal: any, type: string): void {
    this.selectedExpenseTypeModal = type;
    this.modalRefExpenseType = this.modalService.open(modal, {
      size: "xl",
      backdrop: "static",
      keyboard: false,
    });
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchExpense();
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchExpense();
  }

  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchExpense();
  }

  addExpense() {
    this.openAddModal(this.modalBasic);
  }

  viewExpense(data: any) {
    if (data.employee) {
      this.showElement = true;
    } else {
      this.showElement = false;
    }
    this.openDetailsModal(this.modalBasic, data);
  }

  editExpense(data: any) {
    if (data.employee) {
      this.showElement = true;
    } else {
      this.showElement = false;
    }
    this.openEditModal(this.modalBasic, data);
  }

  deleteExpense(data: any) {
    this.openActionModal("delete", this.modal, data);
  }

  approveExpense(data: any) {
    if (data.status === "APPROVED") {
      this.toastr.error("Không thể sửa trạng thái chi phí đã duyệt");
    } else {
      this.openActionModal("approve", this.modal, data);
    }
  }

  rejectExpense(data: any) {
    if (data.status === "APPROVED") {
      this.toastr.error("Không thể sửa trạng thái chi phí đã duyệt");
    } else {
      this.openActionModal("reject", this.modal, data);
    }
  }

  handleExportImport(data: any) {
    this.actionImportExport = data;
    if (this.actionImportExport === "import") {
      this.openImportExportModal(this.modalImportExportService);
    } else {
      this.exportData();
    }
  }

  // Open a generalized modal for delete, approve, or reject actions
  openActionModal(
    action: "delete" | "approve" | "reject",
    modalRef,
    expense?: Expense
  ): void {
    this.actionType = action;
    if (expense) {
      this.selectedIds = [expense.id];
      this.selectedExpense = expense;
    } else {
      this.selectedExpense = null;
    }

    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  handleSendSelected({
    action,
  }: {
    action: "delete" | "approve" | "reject";
  }) {
    this.selectedIds = this.selectedItems.map((item) => item.id);
    switch (action) {
      case "delete":
        this.openActionModal("delete", this.modal);
        break;
      case "approve":
        this.openActionModal("approve", this.modal);
        break;
      case "reject":
        this.openActionModal("reject", this.modal);
        break;
      default:
        console.error(`Unknown action: ${action}`);
    }
  }

  anySelected(): boolean {
    return this?.selectedItems?.length > 0; // Trả về true nếu có phần tử được chọn
  }

  handleSelectedItemsChange(selectedItems: any[]) {
    this.selectedItems = selectedItems;
    this.anySelected();
  }

  // Execute the action when confirmed in the modal
  confirmAction(modal): void {
    this.deleteLoading = true;

    switch (this.actionType) {
      case "delete":
        this.deleteSelectedExpense(modal);
        break;
      case "approve":
        this.approveSelectedExpense(modal);
        break;
      case "reject":
        this.rejectSelectedExpense(modal);
        break;
    }
  }

  deleteSelectedExpense(modal): void {
    this._salaryCostsService.deleteExpense(this.selectedIds).subscribe(
      (response) => {
        this.handleActionResponse(response, "Xóa chi phí thành công", modal);
      },
      (error) => {
        this.handleActionError(error, modal);
      }
    );
  }

  approveSelectedExpense(modal): void {
    // Lấy giá trị từ giao diện
    const expenseDate = this.selectedExpenseDate; // Ngày thực chi từ modal
    const bankAccountId = this.selectedSourceAccount; // Tài khoản nguồn từ modal

    // Kiểm tra giá trị trước khi gửi
    if (!expenseDate || !bankAccountId) {
      this.toastr.error(
        "Vui lòng cung cấp đầy đủ thông tin: Ngày thực chi và Tài khoản nguồn.",
        "Lỗi"
      );
      return; // Dừng xử lý nếu thiếu thông tin
    }

    // Tạo payload với đủ thông tin
    const body = {
      ids: this.selectedIds,
      status: "APPROVED",
      expenseDate: expenseDate,
      bankAccountId: bankAccountId,
    };

    // Gửi yêu cầu API
    this._expenseService.changeStatus(body).subscribe(
      (response) => {
        this.handleActionResponse(response, "Duyệt chi phí thành công", modal);
      },
      (error) => {
        this.handleActionError(error, modal);
      }
    );
  }

  rejectSelectedExpense(modal): void {
    const body = { ids: this.selectedIds, status: "REJECTED" };
    this._salaryCostsService.changeStatus(body).subscribe(
      (response) => {
        this.handleActionResponse(
          response,
          "Từ chối chi phí thành công",
          modal
        );
      },
      (error) => {
        this.handleActionError(error, modal);
      }
    );
  }

  downloadTemplate(): void {
    this._salaryCostsService
      .getTemplate(`${this.selectedBranchImportExport.value}`, "SALARY", this.billingCycleTemplate)
      .subscribe(
        (response) => {
          // Tạo Blob từ response
          const blob = new Blob([response], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

          // Tạo URL cho Blob
          const url = window.URL.createObjectURL(blob);

          // Tạo liên kết tải xuống tạm thời
          const a = document.createElement("a");
          a.href = url;
          a.download = "Template_Bang_Luong.xlsx"; // Đặt tên cho file tải xuống
          document.body.appendChild(a);
          a.click();

          // Dọn dẹp liên kết tạm thời
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        (error) => {
          console.error("Error downloading template:", error);
          // Bạn có thể thêm thông báo lỗi cho người dùng ở đây nếu cần
        }
      );
  }

  exportData(): void {
    this._salaryCostsService.export().subscribe(
      (response) => {
        // Tạo Blob từ response
        const blob = new Blob([response], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // Tạo URL cho Blob
        const url = window.URL.createObjectURL(blob);

        // Tạo liên kết tải xuống tạm thời
        const a = document.createElement("a");
        a.href = url;
        a.download = "Bang_Luong.xlsx"; // Đặt tên cho file tải xuống
        document.body.appendChild(a);
        a.click();

        // Dọn dẹp liên kết tạm thời
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error("Error downloading template:", error);
        // Bạn có thể thêm thông báo lỗi cho người dùng ở đây nếu cần
      }
    );
  }

  // Hàm xử lý chọn file
  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.includes("spreadsheetml")) {
      // Kiểm tra loại file là excel
      this.selectedFile = file;
    } else {
      this.toastr.error("Vui lòng chọn file excel.");
      this.selectedFile = null;
    }
  }

  submitData(modal: NgbModalRef): void {
    if (!this.selectedFile) {
      this.toastr.error("Vui lòng chọn file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", this.selectedFile);

    // Thêm tùy chọn isSalary, giả sử isSalary là true (hoặc có thể thay đổi tùy theo logic của bạn)
    const type = "SALARY";
    this.isUploading = true;
    this._salaryCostsService.importExpense(formData, type).subscribe(
      (response) => {
        this.isUploading = false;
        if (response.code === 201) {
          this.toastr.success(response.data.message, "Thành công");
          modal.close();
          this.fetchExpense();
          this.selectedFile = null;
        } else {
          this.toastr.error(response.message);
        }
      },
      (error) => {
        this.isUploading = false;
        this.toastr.success("Tải lên thất bại. Vui lòng thử lại.", "Thất bại");
      }
    );
  }

  // Handle success response for all actions
  private handleActionResponse(response, successMessage: string, modal): void {
    this.deleteLoading = false;
    if (response.code === 201 || response.code === 200) {
      this.toastr.success(successMessage);
      this.fetchExpense();
      this.selectedIds = [];
      modal.close();
    } else {
      this.toastr.error("Hành động thất bại");
      modal.close();
    }
  }

  // Handle error for all actions
  private handleActionError(error, modal): void {
    this.deleteLoading = false;
    this.toastr.error("Có lỗi xảy ra", "Lỗi");
    console.error("Có lỗi xảy ra", error);
    modal.close();
  }

  async filterByBranch(branch: any): Promise<void> {
    this.currentPage = 1;
    this.searchByEmployee = null;
    this.fetchExpense();
    if (!branch) {
      this.searchByBranch = null;
      this.searchByEmployee = null;
      this.employeesArray = [];
    } else {
      this.searchByBranch = branch.id;
      try {
        const data = await this._employeeService
          .getEmployeeByBranch(branch.id)
          .toPromise(); // Chuyển Observable thành Promise để sử dụng await
        this.employeesArray = data.data || [];
      } catch (error) {
        console.error('Lỗi khi tải danh sách phòng ban:', error);
        this.employeesArray = [];
      }
    }

  }

  filterByEmployee(employee: any): void {
    this.currentPage = 1;
    if (!employee) {
      this.searchByEmployee = null;
    } else {
      this.searchByEmployee = employee.id;
    }
    this.fetchExpense();
  }

  filterByStatus(status: any): void {
    if (!status) {
      this.searchByStatus = null;
    } else {
      this.searchByStatus = status.value;
    }

    this.currentPage = 1;
    this.fetchExpense();
  }

  selectService(service: any) {
    this.selectedExpenseType.push(service);
  }

  // Hàm xác nhận lựa chọn
  confirmSelection(modal: any) {
    modal.close();
  }

  onSearch(searchTerm: string): void {
    this.searchByName = searchTerm.trim();

    this.currentPage = 1;
    this.fetchExpense();
  }

  fetchExpense(): void {
    this.loading = true;
    this._salaryCostsService
      .filterExpense(
        this.currentPage,
        this.itemsPerPage,
        this.sortColumn,
        this.sortDirection,
        this.searchByName,
        this.searchByBranch,
        this.searchByStatus,
        this.searchByEmployee,
        this.billingCycle
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          this.toastr.error("Lỗi khi tải danh sách lương");
          console.error("Position Fetch Error:", error);
          return [];
        })
      )
      .subscribe((data: any) => {
        const items = data?.data?.items || [];
        this.expenseArray = data?.data?.items.map((item: any) => {
          return {
            ...item,
            date: item.expenseDate ? item.expenseDate : "",
            branchName: item.branch.branchName,
            employeeName: item.employee ? item.employee.fullName : "",
            sourceAccountName: item?.bankAccount?.accountNumber
              ? item.bankAccount.accountNumber
              : "",
          };
        });

        this.totalItems = data?.data?.meta.totalItems;
        this.currentPage = data?.data?.meta.currentPage;
        this.itemsPerPage = data?.data?.meta.itemsPerPage;
        this.totalPage = data?.data?.meta.totalPages;

        this.loading = false;
        return items;
      });
  }

  onSubmitReactiveForm(modal): void {
    this.formLoading = true;

    if (this.form.valid) {
      const data = this.form.value;
      const formData = {
        ...data,
        departmentId: undefined,
        taxRate: data.taxRate === null ? 0 : data.taxRate,
        expenseItems: [...(data.salaryItems || []), ...(data.deductionItems || [])].map(({ formulaType, ...item }) => {
          return {
            ...item,
            expenseRanges: undefined,
            price: item.price ? this.removeFormatting(item.price) : undefined,
          };
        }),
        salaryItems: undefined, // Loại bỏ salaryItems
        deductionItems: undefined, // Loại bỏ deductionItems
        preTaxAmount: undefined,
        postTaxAmount: undefined,
        type: "SALARY",
      };

      if (this.modalMode === "add") {
        // Gọi API tạo mới
        this._salaryCostsService.createExpense(formData).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success("Thêm chi phí thành công", "Thành công");
              modal.close();
              this.fetchExpense();
              this.form.reset();
              this.clearExpenseItems();
            } else {
              this.displayApiErrors(response.message);
            }
          },
          (error) => {
            this.formLoading = false;
            console.error("Có lỗi xảy ra khi thêm mới", error);
          }
        );
      } else if (this.modalMode === "edit" && this.selectedExpense) {
        // Gọi API chỉnh sửa
        this._salaryCostsService
          .updateExpense(this.selectedExpense.id, formData)
          .subscribe(
            (response) => {
              this.formLoading = false;
              if (response.code === 200) {
                this.toastr.success(
                  "Chỉnh sửa chi phí thành công",
                  "Thành công"
                );
                modal.close();
                this.fetchExpense();
                this.form.reset();
                this.clearExpenseItems();
              } else {
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

  displayApiErrors(errors: any[], formGroup: FormGroup = this.form): void {
    errors.forEach((error) => {
      const field = error.field;

      // Nếu lỗi nằm trong các field chính của form
      if (formGroup.controls[field]) {
        const control = formGroup.get(field);
        control?.setErrors({ apiError: error.errors.join(', ') });
      }

      // Nếu lỗi nằm trong các FormArray hoặc nested FormGroup
      if (error.children && error.children.length > 0) {
        const arrayOrGroup = formGroup.get(field);
        if (arrayOrGroup instanceof FormArray) {
          error.children.forEach((childError, index) => {
            const childControl = arrayOrGroup.at(index) as FormGroup;
            this.displayApiErrors([childError], childControl); // Đệ quy để xử lý lỗi con
          });
        } else if (arrayOrGroup instanceof FormGroup) {
          this.displayApiErrors(error.children, arrayOrGroup); // Đệ quy để xử lý nested FormGroup
        }
      }
    });
  }

  openImportExportModal(modalRef): void {
    this.modalMode = "add";
    this.modalService.open(modalRef, {
      size: "sm",
      backdrop: "static",
      keyboard: false,
    });
  }

  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.showElement = false;
    this.selectedExpense = null;
    this.selectedBranch = null;
    this.selectedDepartment = null;
    this.selectedEmployee = null;
    this.form.reset();
    this.initializeForm();
    this.form.enable();
    this.isDepartmentDisabled = true;
    this.isEmployeeDisabled = true;
    this.isBranchDisabled = false;
    this.isMonthDisabled = false;
    this.modalService.open(modalRef, {
      size: "xl",
      backdrop: "static",
      keyboard: false,
    });
  }
  clearExpenseItems(): void {
    this.salaryItems.clear(); // Clear all salary items
    this.deductionItems.clear(); // Clear all deduction items
  }

  onCloseImportExportModal(modal: any): void {
    this.form.reset(); // Reset toàn bộ form
    modal.dismiss("Cross click"); // Đóng modal
    this.selectedBranchImportExport = null;
  }

  onCloseModal(modal: any): void {
    this.selectedBranch = null;
    this.selectedDepartment = null;
    this.selectedEmployee = null;
    this.form.reset(); // Reset toàn bộ form
    this.isDepartmentDisabled = true;
    this.isEmployeeDisabled = true;
    modal.dismiss("Cross click"); // Đóng modal
    this.clearExpenseItems();
  }
  getDateFromBillingCycle(billingCycle: string) {
    const [month, year] = billingCycle.split("-").map(Number); // Tách chuỗi thành tháng và năm
    this.selectedMonthYearModal = new Date(year, month - 1, 1); // Ngày 1 của tháng được cung cấp
  }

  formatCurrency(value: number | string): string {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value));
  }

  async openDetailsOrUpdateModal(
    modalRef,
    expense: any,
    mode: "view" | "edit"
  ): Promise<void> {
    this.modalLoading = true;
    this.modalMode = mode;

    // Open the modal immediately and show loading state
    this.modalService.open(modalRef, {
      size: "xl",
      backdrop: "static",
      keyboard: false,
    });

    try {
      // Gọi API để lấy thông tin nhân viên
      const response: any = await this._expenseService
        .getOneExpense(expense.id)
        .toPromise();

      if (response?.data) {
        this.getDateFromBillingCycle(response.data.billingCycle);
        this.selectedExpense = response.data;
        this.selectedBranch = this.selectedExpense.branch;
        this.selectedDepartment = this.selectedExpense.department;
        this.selectedEmployee = this.selectedExpense.employee;

        const detailexpense = {
          branchId: this.selectedExpense.branch.id,
          departmentId: this.selectedExpense.department
            ? this.selectedExpense.department.id
            : null,
          employeeId: this.selectedExpense.employee
            ? this.selectedExpense.employee.id
            : null,
          expenseName: this.selectedExpense.expenseName,
          billingCycle: this.selectedExpense.billingCycle,
          taxRate: +this.selectedExpense.taxRate,
          preTaxAmount: this.formatCurrency(this.selectedExpense.preTaxAmount),
          postTaxAmount: this.formatCurrency(this.selectedExpense.totalAmount),
        };

        this.form.patchValue(detailexpense);
        if (this.selectedExpense.expenseItems && this.selectedExpense.expenseItems.length > 0) {
          const salaryItemsArray = this.form.get("salaryItems") as FormArray;
          const deductionItemsArray = this.form.get("deductionItems") as FormArray;



          const itemsWithRanges = await Promise.all(
            this.selectedExpense.expenseItems.map(async (item) => {
              if (item.formulaType === "TIERED_COST") {
                try {
                  const response = await this._expenseTypeService.getOneExpenseType(item.expenseTypeId).toPromise();
                  const expenseRanges = response.data.expenseRanges || [];
                  return { ...item, expenseRanges };
                } catch (error) {
                  console.error(`Error fetching expenseType details for item ${item.expenseTypeId}:`, error);
                  return { ...item, expenseRanges: [] }; // Gán mảng rỗng nếu API lỗi
                }
              }
              return { ...item, expenseRanges: [] }; // Gán mảng rỗng nếu không phải TIERED_COST
            })
          );

          itemsWithRanges.forEach((item) => {
            const formGroup = this.fb.group({
              expenseTypeId: [item.expenseTypeId, Validators.required],
              expenseItemName: [item.expenseItemName || ''],
              formulaType: [item.formulaType || ''],
              quantity: [Number(item.quantity), [Validators.required, Validators.min(1)]],
              price: [this.formatCurrency(item.price) || null, this.conditionalRequiredValidator(() => item.formulaType !== 'TIERED_COST')],
              baseQuantity: [Number(item.baseQuantity), [Validators.min(0)]],
              taxRate: [Number(item.taxRate), [Validators.min(0), Validators.max(100)]],
              discount: [Number(item.discount), [Validators.min(0), Validators.max(100)]],
              expenseRanges: [item.expenseRanges || []],
            });
            if (item.expenseType === "SALARY") {
              salaryItemsArray.push(formGroup);
            } else if (item.expenseType === "DEDUCTION") {
              deductionItemsArray.push(formGroup);
            }
          });
        }

        if (mode === "view") {
          this.form.disable();
          this.isDepartmentDisabled = true;
          this.isEmployeeDisabled = true;
          this.isBranchDisabled = true;
          this.isMonthDisabled = true;
        }
        else if (mode === "edit") {
          this.isDepartmentDisabled = false;
          this.isEmployeeDisabled = false;
          this.isBranchDisabled = false;
          this.isMonthDisabled = false;
          this.form.enable();
        }
      } else {
        this.toastr.error(`Không có dữ liệu cho hóa đơn ID: ${expense.id}`);
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      this.toastr.error("Lỗi khi tải thông tin hóa đơn.");
    } finally {
      this.modalLoading = false; // Tắt trạng thái loading dù thành công hay thất bại
    }
  }

  openDetailsModal(modalRef, expense: Expense): void {
    this.openDetailsOrUpdateModal(modalRef, expense, "view");
  }

  openEditModal(modalRef, expense: Expense): void {
    this.openDetailsOrUpdateModal(modalRef, expense, "edit");
  }

  async onBranchChange(event: any): Promise<void> {
    const branchId = event?.id;

    if (branchId) {
      try {
        const data = await this._departmentService.getDepartmentByBranch(branchId).toPromise();
        if (data.code === 200) {
          this.departments = data.data;
          this.form.get("departmentId")?.enable();
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    } else {
      this.clearDepartmentAndEmployeeFields();
    }

    this.form.get("departmentId")?.setValue(null);
  }

  private clearDepartmentAndEmployeeFields(): void {
    this.form.get("departmentId")?.setValue(null);
    this.form.get("departmentId")?.disable();
    this.form.get("employeeId")?.setValue(null);
    this.form.get("employeeId")?.disable();
  }
  async onDepartmentChange(event: any): Promise<void> {
    const departmentId = event?.id;

    if (departmentId) {
      try {
        const data = await this._employeeService.getEmployeeByDepartment(departmentId).toPromise();
        if (data.code === 200) {
          this.employees = data.data;
          this.form.get("employeeId")?.enable();
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    } else {
      this.clearEmployeeField();
    }

    this.form.get("employeeId")?.setValue(null);
  }

  private clearEmployeeField(): void {
    this.form.get("employeeId")?.setValue(null);
    this.form.get("employeeId")?.disable();
  }

  async getBranches() {
    try {
      const data = await this._branchService.getAllBranches().toPromise();
      const addOption = { branchName: 'Tất cả các chi nhánh', value: 'all' };
      this.selectedBranchImportExport = addOption;
      this.branches = [addOption, ...data.data];
      this.branchsArray = data.data;
    } catch (error) {
      console.error("Có lỗi khi tải danh sách chi nhánh:", error);
      this.toastr.error("Không thể tải danh sách chi nhánh. Vui lòng thử lại.");
    }
  }

  loadBankAccounts(): void {
    this._accountListService
      .getAllBankAccount()
      .subscribe({
        next: (accounts) => {
          this.bankAccounts = accounts.data || [];
        },
        error: (err) => {
          console.error("Lỗi khi lấy danh sách tài khoản ngân hàng", err);
        }
      });
  }

  ngOnInit(): void {
    this.loadBankAccounts();
    this.cols = [
      { field: "name", header: "Tên loại chi phí" },
      { field: "description", header: "Mô tả" },
      { field: "parentExpenseTypeName", header: "Chi phí gốc" }, // Cột này sẽ hiển thị parentExpenseType.name
    ];

    this.getBranches();
    this.fetchExpense();

    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._salaryCostsService.onExpenseListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
          }, 450);
        } else {
          this._salaryCostsService.onExpenseListChanged
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
