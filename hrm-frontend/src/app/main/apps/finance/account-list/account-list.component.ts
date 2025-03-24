import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import {
  ColumnMode,
  DatatableComponent,
} from "@swimlane/ngx-datatable";
import { FlatpickrOptions } from "ng2-flatpickr";
import { Subject } from "rxjs";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreConfigService } from "@core/services/config.service";
import { ToastrService } from "ngx-toastr";
import { catchError, finalize, takeUntil } from "rxjs/operators";
import { AccountListService } from "./account-list.service";
import { BANK_LIST } from "common/bank-list";
@Component({
  selector: "app-account-list",
  templateUrl: "./account-list.component.html",
  styleUrls: ["./account-list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AccountListComponent implements OnInit {
  public temp = [];
  public rows: any[] = [];
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public modalMode: "add" | "edit" | "view" = "add";
  public selectedBankAccount: any = null;
  public selectedItems = [];
  public deletedIds = [];
  public selectedRows: any[] = [];
  public bankList: any[] = [];
  public filterBankList: any[] = [];
  public branchList: any[] = [];

  public bankAccountArrays = [];


  public basicDateOptions: FlatpickrOptions = {
    altInput: true,
  };
  formErrors: { [key: string]: string[] } = {};

  @ViewChild("modalAddEdit") modalAddEdit: any;
  @ViewChild("modalView") modalView: any;
  @ViewChild("modalDelete") modalDelete: any;

  totalItems: number = 0; // Tổng số bản ghi (lấy từ API)
  itemsPerPage: number = 10; // Số bản ghi mỗi trang
  currentPage: number = 1; // Trang hiện tại
  totalPage: number = 0; // Tổng số trang

  sortColumn: string = "createdAt"; // Cột sắp xếp mặc định
  sortDirection: string = "DESC"; // Hướng sắp xếp mặc định

  searchByBankName: string = null;
  searchByAccountName: string = "";

  columnArray: any[] = [
    {
      header: "Tên tài khoản",
      fieldName: "accountName",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Số tài khoản",
      fieldName: "accountNumber",
      dataType: "string",
      width: "750px",
    },
    {
      header: "Ngân hàng",
      fieldName: "bankName",
      dataType: "string",
      width: "750px",
    },
    {
      header: "Số dư",
      fieldName: "balance",
      dataType: "string",
      width: "400px",
    },
  ];

  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;
  private form: FormGroup;
  public loading: boolean = false;
  public formLoading: boolean = false;
  public modalLoading: boolean = false;
  public deleteLoading: boolean = false;
  public isLoadingDistricts = false;
  public isLoadingWards = false;
  public modalRef: any;
  expenseTypeFields: Array<{ label: string; value: string | null | undefined }> = [];
  tableTitle: string = "Quản lý tài khoản nguồn";

  constructor(
    private _accountListService: AccountListService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) {
    this._unsubscribeAll = new Subject();
    this.initializeForm();
  }

  initializeForm(): void {
    this.form = this.fb.group({
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
        [Validators.required],
      ],
      bankName: ["", Validators.required],
      balance: [
        "",
        [Validators.required, Validators.pattern("^[0-9.]*$")],
      ],
      closingDate: ["", Validators.required],
      // branchId: ["", Validators.required],
    });
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchBankAccounts();
  }

  // Hàm thay đổi số bản ghi mỗi trang
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchBankAccounts();
  }

  // Hàm nhận sự kiện sắp xếp từ void-table.component.ts
  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchBankAccounts();
  }

  addBankAccount() {
    this.openAddModal(this.modalAddEdit);
  }

  viewBankAccount(data: any) {
    this.openDetailsModal(this.modalView, data);
  }

  editBankAccount(data: any) {
    this.openEditModal(this.modalAddEdit, data);
  }

  deleteBankAccount(data: any) {
    this.openDeleteModal(this.modalDelete, data);
  }

  openDetailsModal(modalRef, branch: any): void {
    this.openDetailsOrUpdateModal(modalRef, branch, "view");
  }

  openEditModal(modalRef, branch: any): void {
    this.openDetailsOrUpdateModal(modalRef, branch, "edit");
  }

  handleSendSelected() {
    this.deletedIds = this.selectedItems.map((item) => item.id);

    this.openDeleteModal(this.modalDelete);
  }

  anySelected(): boolean {
    return this?.selectedItems?.length > 0; // Trả về true nếu có phần tử được chọn
  }

  handleSelectedItemsChange(selectedItems: any[]) {
    this.selectedItems = selectedItems;
    this.anySelected();
  }

  filterByBankName(bank: any): void {
    if (!bank) {
      this.searchByBankName = null;
    } else {
      this.searchByBankName = bank.code;
    }
    this.currentPage = 1;
    this.fetchBankAccounts();
  }

  onSearch(searchTerm: string): void {
    this.searchByAccountName = searchTerm.trim();
    this.currentPage = 1;
    this.fetchBankAccounts();
  }

  fetchBankAccounts(
  ): void {
    this.loading = true;
    this._accountListService
      .filterBankAccount(
        this.currentPage,
        this.itemsPerPage,
        this.sortColumn,
        this.sortDirection,
        this.searchByBankName,
        this.searchByAccountName
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
        this.bankAccountArrays = data?.data?.items;

        this.bankList = BANK_LIST.map(bank => ({
          ...bank,
          bankName: `${bank.name} (${bank.code})`, // Định dạng Bank Name theo yêu cầu
        }));
        this.filterBankList = this.bankList;


        this.totalItems = data?.data?.meta.totalItems;
        this.currentPage = data?.data?.meta.currentPage;
        this.itemsPerPage = data?.data?.meta.itemsPerPage;
        this.totalPage = data?.data?.meta.totalPages;
      });

  }


  async fetchBranches(): Promise<void> {
    try {
      const branches = await this._accountListService.getBranchList().toPromise();
      if (branches && branches.length > 0) {
        this.branchList = branches;
        console.log("Danh sách chi nhánh đã tải:", this.branchList);
      } else {
        this.branchList = [];
        console.warn("Không tìm thấy danh sách chi nhánh.");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách chi nhánh:", error);
      this.branchList = []; // Fallback cho danh sách trống
    }
  }
  formatDateToDatetimeLocal(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  removeFormatting(value: string): number {
    return Number(value.replace(/[^0-9]/g, "")); // Loại bỏ ký tự không phải số
  }

  onSubmitReactiveForm(modal): void {
    this.formLoading = true;

    if (this.form.valid) {
      const formData = this.form.value;
      const dataToSend: any = {
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        balance: this.removeFormatting(formData.balance),
        closingDate: formData.closingDate,
        // ownerId: formData.branchId, // Sử dụng chi nhánh như ownerId
        ownerType: "Company", // Set ownerType thành "Company"
        status: "Active", // Set trạng thái mặc định là "Active"
      };


      if (this.modalMode === "add") {
        // Gọi API để tạo tài khoản mới
        this._accountListService.createBankAccount(dataToSend).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success(
                "Tạo tài khoản ngân hàng thành công",
                "Thành công"
              );
              modal.close();
              this.fetchBankAccounts();
              this.form.reset();
            } else {
              this.displayApiErrors(response.message);
            }
          },
          (error) => {
            this.formLoading = false;
            if (error.status === 409) {
              const apiError = error.error.message[0];
              this.form.controls["accountNumber"].setErrors({
                apiError: apiError.errors[0],
              });
            }
          }
        );
      } else if (this.modalMode === "edit" && this.selectedBankAccount) {
        // Gọi API để chỉnh sửa tài khoản ngân hàng
        this._accountListService
          .updateBankAccount(this.selectedBankAccount.id, dataToSend)
          .subscribe(
            (response) => {
              this.formLoading = false;
              if (response.code === 200) {
                this.toastr.success(
                  "Chỉnh sửa tài khoản ngân hàng thành công",
                  "Thành công"
                );
                modal.close();// Làm mới danh sách
                this.fetchBankAccounts();
                this.form.reset();
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

  displayApiErrors(apiErrors: any): void {
    if (Array.isArray(apiErrors)) {
      // Handle case where apiErrors is an array
      apiErrors.forEach((err) => {
        if (this.form.controls[err.field]) {
          this.form.controls[err.field].setErrors({ apiError: err.errors });
        }
      });
    } else if (typeof apiErrors === "object") {
      // Handle case where apiErrors is an object
      Object.keys(apiErrors).forEach((key) => {
        if (this.form.controls[key]) {
          this.form.controls[key].setErrors({ apiError: apiErrors[key] });
        }
      });
    } else if (typeof apiErrors === "string") {
      // Handle case where apiErrors is a string (e.g., SQL error)
      console.error("API error message:", apiErrors);

      // Extract meaningful message for the user
      if (apiErrors.includes("Duplicate entry")) {
        const field = apiErrors.includes("account number")
          ? "accountNumber"
          : "bankName";
        this.form.controls[field].setErrors({
          apiError: "Số tài khoản đã tồn tại trong ngân hàng này.",
        });
      } else {
        // Optionally, display a general error message to the user
        this.form.setErrors({ apiError: apiErrors });
      }
    } else {
      console.error("Unexpected API error format:", apiErrors);
    }
  }

  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedBankAccount = null;
    this.form.reset();
    this.form.enable();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }
  onCloseModal(modal: any): void {
    this.form.reset(); // Reset toàn bộ form
    modal.dismiss("Cross click"); // Đóng modal
  }

  openDeleteModal(modalRef, accountBank?: any): void {
    if (accountBank) {
      this.deletedIds = [accountBank.id]; // Nếu chỉ xóa 1 account
      this.selectedBankAccount = accountBank;
    } else {
      this.selectedBankAccount = null;
    }
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  openDetailsOrUpdateModal(
    modalRef,
    accountBank: any,
    mode: "view" | "edit"
  ): void {
    this.modalLoading = true;
    this.modalMode = mode;

    this.modalRef = this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    if (accountBank) {
      this._accountListService.getOneBankAccount(accountBank.id).toPromise().then((data) => {
        this.selectedBankAccount = data.data;
        if (mode === "edit") {
          const selectedBranch = this.branchList.find(
            (branch) => branch.id === this.selectedBankAccount.ownerId
          );
          const selectedBank = this.bankList.find(
            (bank) => bank.code === this.selectedBankAccount.bankName
          );

          const detailBankAccount = {
            accountName: this.selectedBankAccount.accountName || "",
            accountNumber: this.selectedBankAccount.accountNumber || "",
            balance: this.formatCurrency(this.selectedBankAccount.balance) || "",
            closingDate: this.formatDateToDatetimeLocal(this.selectedBankAccount.closingDate) || "",
            // branchId: selectedBranch ? selectedBranch.id : "",
            bankName: selectedBank ? selectedBank.code : "",
            status: this.selectedBankAccount.status || "Active",
          };

          // Patch giá trị vào form
          this.form.patchValue(detailBankAccount);

          this.form.enable();
        }
        else if (mode === "view") {
          this.generateBankAccountFields();
        }

      }).catch((error) => {
        console.log(error);

        this.toastr.error("Không thể lấy chi tiết loại chi phí", "Lỗi");
      }).finally(() => {
        this.modalLoading = false;
      })

    }
  }

  generateBankAccountFields(): void {
    this.expenseTypeFields = [
      { label: 'Tên tài khoản', value: this.selectedBankAccount.accountName },
      { label: 'Số tài khoản', value: this.selectedBankAccount.accountNumber },
      { label: 'Ngân hàng', value: this.selectedBankAccount.bankName },
      { label: 'Số dư', value: `${this.formatCurrency(this.selectedBankAccount.balance)} đ` },
      { label: 'Ngày chốt', value: this.formatDateTimeToReadable(this.selectedBankAccount.closingDate) },
    ];
  }
  formatDateTimeToReadable(date: string): string {
    if (!date) {
      return 'N/A'; // Nếu ngày không tồn tại, trả về N/A hoặc chuỗi mặc định
    }
    const parsedDate = new Date(date);
    return parsedDate.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }


  formatCurrency(value: number | string): string {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(value));
  }


  deleteSelectedAccountBank(modal): void {
    this.deleteLoading = true;

    // Gọi API để xóa tài khoản ngân hàng dựa trên các ID đã chọn
    this._accountListService.deleteBankAccount(this.deletedIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.deleteLoading = false;
          this.toastr.success("Xóa tài khoản ngân hàng thành công");

          // Làm mới danh sách tài khoản ngân hàng sau khi xóa thành công
          this.fetchBankAccounts();

          this.deletedIds = [];
          // Đóng modal
          modal.close();
        } else {
          this.deleteLoading = false;
          this.toastr.error("Xóa tài khoản ngân hàng thất bại");
          modal.close();
        }
      },
      (error) => {
        this.deleteLoading = false;
        console.error("Có lỗi xảy ra khi xóa tài khoản ngân hàng", error);
        this.toastr.error("Có lỗi xảy ra khi xóa tài khoản ngân hàng");
      }
    );
  }

  ngOnInit(): void {
    this.fetchBankAccounts();
    this.fetchBranches();
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._accountListService.onAccountListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
          }, 450);
        } else {
          this._accountListService.onAccountListChanged
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
