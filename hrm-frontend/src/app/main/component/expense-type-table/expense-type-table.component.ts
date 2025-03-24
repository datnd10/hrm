import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CoreConfigService } from '@core/services/config.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExpenseTypeService } from 'app/main/apps/finance/expense-type/expense-type.service';
import { lessThanValidator, nonEmptyArrayValidator } from 'common/validation';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-expense-type-table',
  templateUrl: './expense-type-table.component.html',
  styleUrls: ['./expense-type-table.component.scss']
})
export class ExpenseTypeTableComponent implements OnInit {

  @Input() expenseType: any;
  @Input() selectedItemsFromParent: any[];
  @Output() selectedItemsChange = new EventEmitter<any[]>();
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expenseType']) {
      const department = changes['expenseType'].currentValue;
      if (department) {
        this.searchByCategory = department;
        this.fetchExpenseTypes(); // Gọi API khi branch hợp lệ
      } else {
        this.expenseTypesArray = []; // Reset nếu branch không hợp lệ
      }
    }
  }

  public deleteLoading: boolean = false;
  public selectedExpenseTypes: any;
  public expenseTypes: any;
  public modalRef: any;
  public expenseTypesArray = [];
  public deleteIds = [];
  public formLoading: boolean = false;

  public modalMode: "add" | "edit" | "view" = "add";
  public selectedExpenseType: any = null;

  totalItems: number = 0; // Tổng số bản ghi (lấy từ API)
  itemsPerPage: number = 10; // Số bản ghi mỗi trang
  currentPage: number = 1; // Trang hiện tại
  totalPage: number = 0; // Tổng số trang

  sortColumn: string = "createdAt"; // Cột sắp xếp mặc định
  sortDirection: string = "DESC"; // Hướng sắp xếp mặc định

  @ViewChild("modalAddEdit") modalAddEdit: any;
  @ViewChild("modalView") modalView: any;
  @ViewChild("modalDelete") modalDelete: any;

  public deletedIds = [];
  public modalLoading: boolean = false;
  expenseTypeFields: Array<{ label: string; value: string | null | undefined }> = [];

  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;

  private form: any;
  public loading: boolean = false;
  public selectedItems: any[] = [];
  constructor(
    private _expenseTypeService: ExpenseTypeService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.initializeForm();
  }

  searchByCategory: string = null;
  searchByName: string = "";
  categoryOptions: any[] = [
    { name: "Lương", value: "SALARY" },
    { name: "Chi phí khác", value: "OTHER" },
    { name: "Chi phí giảm trừ", value: "DEDUCTION" },
  ];

  formulaTypeOptions: any[] = [
    { name: "Lương cơ bản", value: "BASE_SALARY" },
    { name: "Chi phí cố định theo đơn giá", value: "FIXED_COST" },
    { name: "Chi phí biến động", value: "VARIABLE_COST" },
    { name: "Chi phí định mức", value: "TIERED_COST" },
  ];

  tableTitle: string = "Quản lý loại chi phí";
  columnArray: any[] = [
    {
      header: "Tên chi phí",
      fieldName: "name",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Mô tả",
      fieldName: "description",
      dataType: "string",
      width: "750px",
    },
    {
      header: "Loại",
      fieldName: "categoryName",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Công thức tính",
      fieldName: "formulaName",
      dataType: "string",
      width: "400px",
    },
  ];

  initializeForm(): void {
    this.form = this.fb.group({
      name: [
        "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
        ],
      ],
      description: ["", [Validators.minLength(2), Validators.maxLength(255)]],
      type: ["", [Validators.required]],
      formulaType: ["", [Validators.required]],
      expenseRanges: this.fb.array([]),
      basePrice: [0, [Validators.min(0), Validators.pattern("^[0-9.]*$")]],
    });
  }

  get expenseRanges(): FormArray {
    return this.form.get("expenseRanges") as FormArray;
  }

  getCategoryName(type: string): string {
    const category = this.categoryOptions.find(
      (option) => option.value === type
    );
    return category ? category.name : "Chưa có dữ liệu";
  }

  getFormulaTypeName(type: string): string {
    const formula = this.formulaTypeOptions.find(
      (option) => option.value === type
    );
    return formula ? formula.name : "Chưa có dữ liệu";
  }

  addExpenseRanges() {
    const rangeGroup = this.fb.group(
      {
        minRange: [0, [Validators.required]],
        maxRange: [0, [Validators.required]],
        price: [0, [Validators.required, Validators.min(1)]],
      },
      { validators: lessThanValidator("minRange", "maxRange") }
    );
    this.expenseRanges.push(rangeGroup);
  }

  onFormulaTypeChange(selectedFormulaType: any): void {
    const basePriceControl = this.form.get("basePrice");
    const expenseRangesControl = this.form.get("expenseRanges");

    // Đặt validator dựa trên giá trị selectedFormulaType
    switch (selectedFormulaType.value) {
      case "FIXED_COST":
        basePriceControl?.setValidators([Validators.required]);
        expenseRangesControl?.clearValidators(); // Bỏ validator cho expenseRanges
        break;

      case "TIERED_COST":
        basePriceControl?.clearValidators(); // Bỏ validator cho basePrice
        expenseRangesControl?.setValidators([nonEmptyArrayValidator()]);
        break;

      default:
        basePriceControl?.clearValidators();
        expenseRangesControl?.clearValidators();
    }

    // Cập nhật lại trạng thái hợp lệ của các trường
    basePriceControl?.updateValueAndValidity();
    expenseRangesControl?.updateValueAndValidity();
  }

  formatCurrencyVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }


  removeExpenseRange(index: number) {
    this.expenseRanges.removeAt(index);
  }

  onSearch(searchTerm: string): void {
    this.searchByName = searchTerm.trim();
    this.currentPage = 1;
    this.fetchExpenseTypes();
  }
  fetchExpenseTypes(
  ): void {
    this.loading = true;
    this._expenseTypeService
      .filterExpenseType(
        this.currentPage,
        this.itemsPerPage,
        this.sortColumn,
        this.sortDirection,
        this.searchByName,
        this.searchByCategory
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          this.toastr.error("Lỗi khi tải danh sách loại chi phí");
          console.error("Position Fetch Error:", error);
          return [];
        })
      )
      .subscribe((data: any) => {
        this.expenseTypesArray = data?.data?.items.map((item: any) => {
          const formulaOption = this.formulaTypeOptions.find(
            (option) => option.value === item.formulaType
          );

          return {
            ...item,
            categoryName:
              item.type === "SALARY"
                ? "Lương"
                : item.type === "DEDUCTION"
                  ? "Giảm trừ"
                  : "Chi phí khác",
            formulaName: formulaOption ? formulaOption.name : "Không xác định",
          };
        });

        this.totalItems = data?.data?.meta.totalItems;
        this.currentPage = data?.data?.meta.currentPage;
        this.itemsPerPage = data?.data?.meta.itemsPerPage;
        this.totalPage = data?.data?.meta.totalPages;
      });

  }

  onBlurFormat(index: number, controlName: string): void {
    const control = this.expenseRanges.controls[index].get(controlName);
    if (control) {
      const rawValue = control.value;
      const formattedValue = this.formatNumberForDisplay(rawValue);
      control.setValue(formattedValue);
    }
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchExpenseTypes();
  }

  // Hàm thay đổi số bản ghi mỗi trang
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchExpenseTypes();
  }

  // Hàm nhận sự kiện sắp xếp từ void-table.component.ts
  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchExpenseTypes();
  }

  addExpenseType() {
    this.openAddModal(this.modalAddEdit);
  }

  viewExpenseType(data: any) {
    this.openDetailsModal(this.modalView, data);
  }

  editExpenseType(data: any) {
    this.openEditModal(this.modalAddEdit, data);
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
    this.selectedItemsChange.emit(this.selectedItems);
  }

  deleteExpenseType(data: any) {
    this.openDeleteModal(this.modalDelete, data);
  }

  openDetailsModal(modalRef, branch: any): void {
    this.openDetailsOrUpdateModal(modalRef, branch, "view");
  }

  openEditModal(modalRef, branch: any): void {
    this.openDetailsOrUpdateModal(modalRef, branch, "edit");
  }

  openDeleteModal(modalRef, expenseType?: any): void {
    if (expenseType) {
      this.deletedIds = [expenseType.id];
      this.selectedExpenseType = expenseType;
    } else {
      this.selectedExpenseType = null;
    }
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  removeFormatting(value: string): number {
    return Number(value.replace(/[^0-9]/g, "")); // Loại bỏ ký tự không phải số
  }

  formatCurrency(value: number | string): string {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value));
  }

  onSubmitReactiveForm(modal): void {
    if (this.form.invalid) {
      return;
    }
    this.formLoading = true;

    if (this.form.valid) {
      // Tạo một bản sao của dữ liệu form để chỉnh sửa trước khi gửi
      const expenseType = { ...this.form.value };

      // Hàm loại bỏ các ký tự không phải số khỏi chuỗi và chuyển sang kiểu số
      const parseCurrencyToNumber = (value: any): number => {
        // Loại bỏ các ký tự không phải số và chuyển về kiểu số
        return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
      };

      // Chuyển đổi các giá trị 'price', 'minRange', 'maxRange' thành kiểu số nếu công thức là 'TIERED_COST'
      if (
        expenseType.formulaType === "TIERED_COST" &&
        Array.isArray(expenseType.expenseRanges)
      ) {
        expenseType.expenseRanges = expenseType.expenseRanges.map((range) => ({
          ...range,
          minRange: parseCurrencyToNumber(range.minRange), // Ép kiểu minRange về số
          maxRange: parseCurrencyToNumber(range.maxRange), // Ép kiểu maxRange về số
          price: this.removeFormatting(range.price), // Ép kiểu price về số
        }));
      }


      // Kiểm tra và gán giá trị basePrice nếu công thức là 'FIXED_COST'
      if (expenseType.formulaType === "FIXED_COST") {
        expenseType.basePrice = this.removeFormatting(expenseType.basePrice);
      }

      // Chỉ giữ lại basePrice nếu công thức là 'FIXED_COST'
      if (expenseType.formulaType !== "FIXED_COST") {
        delete expenseType.basePrice;
      }

      // Loại bỏ expenseRanges nếu công thức không phải là 'TIERED_COST'
      if (expenseType.formulaType !== "TIERED_COST") {
        delete expenseType.expenseRanges;
      }

      // Xử lý logic gửi dữ liệu
      if (this.modalMode === "add") {
        this._expenseTypeService.createExpenseType(expenseType).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success("Thêm loại chi phí thành công", "Thành công");
              modal.close();
              this.form.reset();
              this.modalRef.close();
              this.fetchExpenseTypes();
            } else {
              this.displayApiErrors(this.form, response.message);
            }
          },
          (error) => {
            console.error("Có lỗi xảy ra khi thêm loại chi phí", error);
            this.formLoading = false;
          }
        );
      } else if (this.modalMode === "edit") {
        this._expenseTypeService
          .updateExpenseType(this.selectedExpenseType.id, expenseType)
          .subscribe(
            (response) => {
              if (response.code === 200) {
                this.toastr.success(
                  "Cập nhật loại chi phí thành công",
                  "Thành công"
                );
                modal.close();
                this.fetchExpenseTypes();
                this.form.reset();
              } else {
                this.displayApiErrors(this.form, response.message);
              }
              this.formLoading = false;
            },
            (error) => {
              console.error("Có lỗi xảy ra khi cập nhật loại chi phí", error);
              this.formLoading = false;
            }
          );
      }
    }
  }

  displayApiErrors(formGroup: FormGroup, apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (formGroup.controls[err.field]) {
        formGroup.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedExpenseType = null;
    this.expenseRanges.clear();
    this.form.reset(); // Reset form cho chức năng thêm mới
    this.form.enable();
    // Đảm bảo rằng modalRef được gán cho this.modalRef
    this.modalRef = this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  openDetailsOrUpdateModal(
    modalRef,
    expenseType: any,
    mode: "view" | "edit"
  ): void {
    this.modalLoading = true;
    this.modalMode = mode;
    this.modalRef = this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    if (expenseType) {
      this._expenseTypeService.getOneExpenseType(expenseType.id).toPromise().then((data) => {
        this.selectedExpenseType = data.data;
        if (mode === "edit") {
          const matchedOption = this.formulaTypeOptions.find(option => option.value == this.selectedExpenseType.formulaType);

          this.onFormulaTypeChange(matchedOption);

          const detailExpenseType: any = {
            ...this.selectedExpenseType,
            type:
              this.selectedExpenseType.type === "SALARY"
                ? "SALARY"
                : this.selectedExpenseType.type === "DEDUCTION"
                  ? "DEDUCTION"
                  : "OTHER",
            basePrice:
              this.selectedExpenseType.formulaType === "FIXED_COST"
                ? this.formatCurrency(this.selectedExpenseType.basePrice) // Giữ giá trị số nguyên
                : null,
          };

          // Chuyển đổi expenseRanges về dạng số nguyên
          const formattedExpenseRanges = this.selectedExpenseType.expenseRanges.map((range) => ({
            ...range,
            minRange: Number(String(range.minRange).replace(/[^0-9.-]+/g, "")), // Chuyển về số nguyên
            maxRange: Number(String(range.maxRange).replace(/[^0-9.-]+/g, "")),
            price: this.formatCurrency(range.price),
          }));

          this.form.patchValue(detailExpenseType);

          this.expenseRanges.clear();
          formattedExpenseRanges.forEach((range) => {
            const rangeGroup = this.fb.group({
              minRange: [range.minRange, [Validators.required]], // Không định dạng lại
              maxRange: [range.maxRange, [Validators.required]],
              price: [range.price, [Validators.required]],
            });
            this.expenseRanges.push(rangeGroup);
          });
          this.form.enable();
        }
        else if (mode === "view") {
          this.generatePositionFields();
        }

      }).catch((error) => {
        this.toastr.error("Không thể lấy chi tiết loại chi phí", "Lỗi");
      }).finally(() => {
        this.modalLoading = false;
      })

    }
  }

  generatePositionFields(): void {
    this.expenseTypeFields = [
      { label: 'Tên loại chi phí', value: this.selectedExpenseType.name },
      { label: 'Loại chi phí', value: this.getCategoryName(this.selectedExpenseType.type) },
      { label: 'Mô tả', value: this.selectedExpenseType.description },
      { label: 'Công thức tính', value: this.getFormulaTypeName(this.selectedExpenseType.formulaType) },
    ];
  }

  // Hàm định dạng số để hiển thị
  formatNumberForDisplay(value: number | string): string {
    const numberValue = Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
    return new Intl.NumberFormat("vi-VN").format(numberValue);
  }

  validateNumberInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    // Chỉ cho phép ký tự số và dấu thập phân
    inputElement.value = inputElement.value.replace(/[^0-9.]/g, "");
  }
  getSelectedExpenseType() {
    this._expenseTypeService.getListExpenseType().subscribe((response) => {
      if (response.code === 200) {
        this.selectedExpenseTypes = response.data;
      }
    });
  }

  deleteselectedExpenseTypes(modal) {
    this.deleteLoading = true; // Thêm dòng này
    this._expenseTypeService.deleteExpenseType(this.deletedIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.toastr.success("Xóa chi phí thành công");
          this.selectedExpenseType = null;
          this.deleteIds = [];
          this.fetchExpenseTypes();
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


  ngOnInit(): void {
  }

}
