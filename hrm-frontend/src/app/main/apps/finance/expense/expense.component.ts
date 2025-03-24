import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
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
import { ExpenseService } from "./expense.service";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { CoreConfigService } from "@core/services/config.service";
import { ToastrService } from "ngx-toastr";
import { catchError, finalize, takeUntil } from "rxjs/operators";
import { Expense } from "shared/models/expense.model";
import { BranchService } from "../../hrm-setting/branch/branch.service";
import { ExpenseTypeService } from "../expense-type/expense-type.service";
import { nonEmptyArrayValidator } from "common/validation";
import { AccountListService } from "../account-list/account-list.service";
import { SalaryCostsService } from "../salary-costs/salary-costs.service";

@Component({
  selector: "app-expense",
  templateUrl: "./expense.component.html",
  styleUrls: ["./expense.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ExpenseComponent implements OnInit {
  // Public
  public temp = [];
  public rows: any[] = [];
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public branches: any = [];
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

  searchByName: string = "";
  searchByStatus: string = null;

  selectedBranchImportExport: any = null;

  expenseArray: any[] = [];
  tableTitle: string = "Quản lý chi phí";
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
    // {
    //   header: "Người thụ hưởng",
    //   fieldName: "employeeName",
    //   dataType: "string",
    //   width: "400px",
    // },
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

  @ViewChild("modalBasic") modalBasic: any;
  @ViewChild("modal") modal: any;
  @ViewChild("modalImportExportService") modalImportExportService: any;
  @ViewChild("otherModal") otherModal: any;
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
  public selectedOtherItemsFromChild: any[] = [];
  public selectedDeductionItemsFromChild: any[] = [];
  public searchByBranch: string;
  public billingCycle: string;
  public billingCycleTemplate: string;

  public loadingExpenseType: boolean = false;
  selectedFile: File | null = null;
  isUploading = false;

  public selectedBranch: any = null;
  public isBranchDisabled = false;
  public isMonthDisabled = false;

  constructor(
    private _accountListService: AccountListService,
    private _expenseService: ExpenseService,
    private _branchService: BranchService,
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
  }

  onBranchBlurred(): void {
    const branchControl = this.form.get('branchId');
    if (!branchControl?.value) {
      branchControl?.markAsTouched(); // Đánh dấu là touched nếu không có giá trị
    }
  }

  onBranchChanged(selectedBranch: any) {
    const branchControl = this.form.get('branchId');
    if (selectedBranch && selectedBranch.id > 0) {
      branchControl?.setValue(selectedBranch.id);
      this.selectedBranch = selectedBranch;
    }
    else {
      this.selectedBranch = null;
      branchControl?.setValue(null);
      branchControl?.markAsTouched();
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
      expenseName: ["", Validators.required],
      billingCycle: [this.getBillingCycleFormat(new Date()), Validators.required],
      taxRate: [10, [Validators.min(0), Validators.max(100)]],
      branchId: [null, Validators.required],
      otherItems: this.fb.array([], nonEmptyArrayValidator()),
      deductionItems: this.fb.array([]),
      preTaxAmount: [{ value: 0, disabled: true }], // Tiền trước thuế
      postTaxAmount: [{ value: 0, disabled: true }], // Tiền sau thuế
    });
    this.setupListeners();
  }

  updateAmounts(): void {
    const otherItems = this.form.get('otherItems')?.value || [];
    const deductionItems = this.form.get('deductionItems')?.value || [];
    const taxRate = this.form.get('taxRate')?.value || 0;

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

    const preTaxOther = calculateTotal(otherItems);
    const totalDeductions = calculateTotal(deductionItems);

    // Tính tiền trước thuế
    const preTaxAmount = preTaxOther - totalDeductions;

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
    this.form.get('taxRate')?.valueChanges.subscribe(() => {
      this.updateAmounts();
    });

    this.form.get('otherItems')?.valueChanges.subscribe(() => {
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

  get otherItems(): FormArray {
    return this.form.get("otherItems") as FormArray;
  }

  get deductionItems(): FormArray {
    return this.form.get("deductionItems") as FormArray;
  }

  getItemsArray(type: string): FormArray {
    return type === "OTHER" ? this.otherItems : this.deductionItems;
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
      if (type === "OTHER") {
        this.selectedOtherItemsFromChild = itemsWithDetails; // Gộp các mảng con thành một mảng duy nhất
      } else if (type === "DEDUCTION") {
        this.selectedDeductionItemsFromChild = itemsWithDetails;
      }
    } catch (error) {
      console.error("Lỗi khi gọi API getOneExpenseType:", error);
    }
  }

  onConfirmExpenseTypeModal(type: string, modal: any): void {
    const selectedItems =
      type === "OTHER"
        ? this.selectedOtherItemsFromChild
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
    this.openDetailsModal(this.modalBasic, data);
  }

  editExpense(data: any) {
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
    this._expenseService.deleteExpense(this.selectedIds).subscribe(
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
    this._expenseService.changeStatus(body).subscribe(
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
    this._expenseService
      .getTemplate(`${this.selectedBranchImportExport.value}`, "OTHER", this.billingCycleTemplate)
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
          a.download = "Template_Chi_Phi.xlsx";
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
    this._expenseService.export().subscribe(
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
        a.download = "Bang_Chi_Phi.xlsx"; // Đặt tên cho file tải xuống
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
    const type = "OTHER";
    this.isUploading = true;
    this._expenseService.importExpense(formData, type).subscribe(
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
    this.fetchExpense();
    if (!branch) {
      this.searchByBranch = null;
    } else {
      this.searchByBranch = branch.id;
    }
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
    this._expenseService
      .filterExpense(
        this.currentPage,
        this.itemsPerPage,
        this.sortColumn,
        this.sortDirection,
        this.searchByName,
        this.searchByBranch,
        this.searchByStatus,
        null,
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
        taxRate: data.taxRate === null ? 0 : data.taxRate,
        expenseItems: [...(data.otherItems || []), ...(data.deductionItems || [])].map(({ formulaType, ...item }) => {
          return {
            ...item,
            expenseRanges: undefined,
            price: item.price ? this.removeFormatting(item.price) : undefined,
          };
        }),
        otherItems: undefined,
        deductionItems: undefined,
        preTaxAmount: undefined,
        postTaxAmount: undefined,
        type: "OTHER",
      };

      if (this.modalMode === "add") {
        // Gọi API tạo mới
        this._expenseService.createExpense(formData).subscribe(
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
        this._expenseService
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
    this.selectedExpense = null;
    this.selectedBranch = null;
    this.form.reset();
    this.initializeForm();
    this.form.enable();
    this.isBranchDisabled = false;
    this.isMonthDisabled = false;
    this.modalService.open(modalRef, {
      size: "xl",
      backdrop: "static",
      keyboard: false,
    });
  }
  clearExpenseItems(): void {
    this.otherItems.clear(); // Clear all salary items
    this.deductionItems.clear(); // Clear all deduction items
  }

  onCloseImportExportModal(modal: any): void {
    this.form.reset(); // Reset toàn bộ form
    modal.dismiss("Cross click"); // Đóng modal
    this.selectedBranchImportExport = null;
  }

  onCloseModal(modal: any): void {
    this.selectedBranch = null;
    this.form.reset(); // Reset toàn bộ form
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
        const detailexpense = {
          branchId: this.selectedExpense.branch.id,
          expenseName: this.selectedExpense.expenseName,
          billingCycle: this.selectedExpense.billingCycle,
          taxRate: +this.selectedExpense.taxRate,
          preTaxAmount: this.formatCurrency(this.selectedExpense.preTaxAmount),
          postTaxAmount: this.formatCurrency(this.selectedExpense.totalAmount),
        };

        this.form.patchValue(detailexpense);
        if (this.selectedExpense.expenseItems && this.selectedExpense.expenseItems.length > 0) {
          const otherItemsArray = this.form.get("otherItems") as FormArray;
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
            if (item.expenseType === "OTHER") {
              otherItemsArray.push(formGroup);
            } else if (item.expenseType === "DEDUCTION") {
              deductionItemsArray.push(formGroup);
            }
          });
        }

        console.log(this.selectedExpense);


        if (mode === "view") {
          this.form.disable();
          this.isBranchDisabled = true;
          this.isMonthDisabled = true;
        } else if (mode === "edit") {
          const isApproved = this.selectedExpense.status === "APPROVED";
          this.isBranchDisabled = isApproved;
          this.isMonthDisabled = isApproved;
          if (isApproved) {
            this.modalMode = "view";
            this.form.disable();
          } else {
            this.form.enable();
          }
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
            this._expenseService.onExpenseListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
          }, 450);
        } else {
          this._expenseService.onExpenseListChanged
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
