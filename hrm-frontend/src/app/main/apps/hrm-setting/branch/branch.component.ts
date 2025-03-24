import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import {
  ColumnMode,
  DatatableComponent,
  SelectionType,
} from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, finalize, takeUntil } from "rxjs/operators";

import { CoreConfigService } from "@core/services/config.service";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FlatpickrOptions } from "ng2-flatpickr";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ValidationPatterns } from "common/validation-patterns";
import { Branch } from "shared/models/branch.model";
import { BranchService } from "./branch.service";

@Component({
  selector: "app-branch",
  templateUrl: "./branch.component.html",
  styleUrls: ["./branch.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class BranchComponent implements OnInit {
  // Public
  public temp = [];
  public rows: any[] = [];
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public provinces: any = [];
  public districts: any = [];
  public wards: any = [];
  public modalMode: "add" | "edit" | "view" = "add";
  public selectedBranch: any = null;
  public selectedIds = [];
  public deletedIds = [];
  public SelectionType = SelectionType;
  public selectedRows: any[] = [];

  public basicDateOptions: FlatpickrOptions = {
    altInput: true,
  };
  formErrors: { [key: string]: string[] } = {};

  statusOptions: any[] = [
    { name: "Đang hoạt động", value: "true" },
    { name: "Ngưng hoạt động", value: "false" },
  ];

  searchByName: string = "";
  searchByStatus: string = null;

  branchsArray: any[] = [];
  tableTitle: string = "Quản lý chi nhánh";
  columnArray: any[] = [
    {
      header: "Tên chi nhánh",
      fieldName: "branchName",
      dataType: "string",
      width: "500px",
    },
    { header: "Email", fieldName: "email", dataType: "string", width: "450px" },
    {
      header: "Địa chỉ",
      fieldName: "address",
      dataType: "string",
      width: "850px",
    },
    {
      header: "Sđt",
      fieldName: "phoneNumber",
      dataType: "string",
      width: "200px",
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
  public selectedItems: any[] = [];

  branchFields: Array<{ label: string; value: string | null }> = [];
  constructor(
    private _branchService: BranchService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.initializeForm();
  }

  initializeForm(): void {
    this.form = this.fb.group({
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

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchBranchList();
  }

  // Hàm thay đổi số bản ghi mỗi trang
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchBranchList();
  }

  // Hàm nhận sự kiện sắp xếp từ void-table.component.ts
  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchBranchList();
  }

  addBranch() {
    this.openAddModal(this.modalAddEdit);
  }

  viewBranch(data: any) {
    this.openDetailModal(this.modalView, data);
  }

  editBranch(data: any) {
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
  }

  deleteBranch(data: any) {
    this.openDeleteModal(this.modalDelete, data);
  }

  filterByStatus(status: any): void {
    this.currentPage = 1;
    if (!status) {
      this.searchByStatus = null;
    } else {
      this.searchByStatus = status.value;
    }
    this.fetchBranchList();
  }

  onSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.searchByName = searchTerm.trim();

    this.fetchBranchList();
  }

  fetchBranchList(): void {
    this.loading = true;
    this._branchService
      .filterBranches(
        this.currentPage,
        this.itemsPerPage,
        this.sortColumn,
        this.sortDirection,
        this.searchByName,
        this.searchByStatus
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          this.toastr.error("Lỗi khi tải danh sách chi nhánh");
          console.error("Position Fetch Error:", error);
          return [];
        })
      )
      .subscribe((data: any) => {
        this.branchsArray = data?.data?.items.map((item: any) => {
          const addressParts = [
            item.specificAddress,
            item.ward,
            item.district,
            item.province,
          ].filter((part) => part); // Lọc bỏ các phần không có giá trị (null, undefined hoặc empty string)

          return {
            ...item,
            address: addressParts.join(", "), // Nối các phần còn lại thành chuỗi với dấu phẩy ngăn cách
          };
        });

        this.totalItems = data?.data?.meta.totalItems;
        this.currentPage = data?.data?.meta.currentPage;
        this.itemsPerPage = data?.data?.meta.itemsPerPage;
        this.totalPage = data?.data?.meta.totalPages;
      });
  }

  onSubmitReactiveForm(modal: any): void {
    this.formLoading = true;
    if (this.form.valid) {
      const formData = this.form.value;
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
      if (this.modalMode === "add") {
        // Gọi API tạo mới
        this._branchService.createBranch(dataToSend).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success("Thêm chi nhánh thành công", "Thành công");
              modal.close();
              this.fetchBranchList();
              this.form.reset();
            } else {
              this.displayApiErrors(response.message);
            }
          },
          (error) => {
            this.formLoading = false;
            console.error("Có lỗi xảy ra khi thêm mới", error);
          }
        );
      } else if (this.modalMode === "edit" && this.selectedBranch) {
        // Gọi API chỉnh sửa
        this._branchService
          .updateBranch(this.selectedBranch.id, dataToSend)
          .subscribe(
            (response) => {
              this.formLoading = false;
              if (response.code === 200) {
                this.toastr.success(
                  "Chỉnh sửa chi nhánh thành công",
                  "Thành công"
                );
                modal.close();
                this.fetchBranchList();
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

  displayApiErrors(apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (this.form.controls[err.field]) {
        this.form.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedBranch = null;
    this.form.reset();
    this.form.enable();
    this.form.get("ward").disable();
    this.form.get("district").disable();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }
  onCloseModal(modal: any): void {
    this.form.reset(); // Reset toàn bộ form
    this.form.get("ward")?.disable(); // Vô hiệu hóa trường `ward`
    this.form.get("district")?.disable(); // Vô hiệu hóa trường `district`
    modal.dismiss("Cross click"); // Đóng modal
  }

  openEditModal(modalRef, branch: Branch): void {
    this.openDetailsOrUpdateModal(modalRef, branch, "edit");
  }

  openDetailModal(modalRef, branch: Branch): void {
    this.openDetailsOrUpdateModal(modalRef, branch, "view");
  }

  async openDetailsOrUpdateModal(
    modalRef: any,
    branch: Branch,
    mode: 'view' | 'edit'
  ): Promise<void> {
    this.modalLoading = true;
    this.modalMode = mode;

    // Mở modal và hiển thị trạng thái loading
    this.modalService.open(modalRef, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    try {
      // Gọi API để lấy thông tin chi nhánh
      const response: any = await this._branchService
        .getOneBranch(branch.id)
        .toPromise();

      if (response?.data) {
        this.selectedBranch = response.data;

        // Gán dữ liệu cơ bản vào form
        const detailBranch: any = {
          branchName: this.selectedBranch.branchName || '',
          specificAddress: this.selectedBranch.specificAddress || '',
          address: this.selectedBranch.address || '',
          province: null,
          district: null,
          ward: null,
          provinceName: null,
          districtName: null,
          wardName: null,
          email: this.selectedBranch.email || '',
          phoneNumber: this.selectedBranch.phoneNumber || '',
          taxCode: this.selectedBranch.taxCode || '',
        };

        if (mode === 'edit') {
          // Lấy thông tin Tỉnh/Thành phố
          const selectedProvince = this.provinces.find(
            (province) => province.name === this.selectedBranch.province
          );
          if (selectedProvince) {
            detailBranch.province = selectedProvince.code;
            detailBranch.provinceName = selectedProvince.name;

            // Lấy thông tin Quận/Huyện
            const districtsResponse = await this._branchService
              .getDistricts(selectedProvince.code)
              .toPromise();
            this.districts = districtsResponse?.districts || [];
            const selectedDistrict = this.districts.find(
              (district) => district.name === this.selectedBranch.district
            );
            if (selectedDistrict) {
              detailBranch.district = selectedDistrict.code;
              detailBranch.districtName = selectedDistrict.name;

              // Lấy thông tin Phường/Xã
              const wardsResponse = await this._branchService
                .getWards(selectedDistrict.code)
                .toPromise();
              this.wards = wardsResponse?.wards || [];
              const selectedWard = this.wards.find(
                (ward) => ward.name === this.selectedBranch.ward
              );
              if (selectedWard) {
                detailBranch.ward = selectedWard.code;
                detailBranch.wardName = selectedWard.name;
              }
            }
          }
        } else if (mode === 'view') {
          // Cập nhật trường hợp xem chi nhánh
          this.updateBranchFields();
          this.form.disable(); // Khóa form khi ở chế độ xem
        }

        // Cập nhật form với dữ liệu chi tiết
        this.form.patchValue(detailBranch);
        this.form.enable();
      } else {
        this.toastr.error(`Không có dữ liệu cho chi nhánh ID: ${branch.id}`);
      }
    } catch (error) {
      console.error('Error fetching branch details:', error);
      this.toastr.error('Lỗi khi tải thông tin chi nhánh.');
    } finally {
      this.modalLoading = false; // Tắt trạng thái loading
    }
  }

  updateBranchFields(): void {
    this.branchFields = [
      { label: 'Tên chi nhánh', value: this.selectedBranch?.branchName },
      {
        label: 'Địa chỉ',
        value: this.selectedBranch
          ? [
            this.selectedBranch?.specificAddress || '',
            this.selectedBranch?.ward || '',
            this.selectedBranch?.district || '',
            this.selectedBranch?.province || '',
          ]
            .filter((part) => part.trim() !== '') // Loại bỏ các giá trị rỗng hoặc chỉ chứa khoảng trắng
            .join(', ') // Nối các phần còn lại bằng dấu phẩy
          : '',
      },
      { label: 'Email', value: this.selectedBranch?.email },
      { label: 'Số điện thoại', value: this.selectedBranch?.phoneNumber },
      { label: 'Mã số thuế', value: this.selectedBranch?.taxCode },
    ];
  }


  openDeleteModal(modalRef, branch?: Branch): void {
    if (branch) {
      this.deletedIds = [branch.id];
      this.selectedBranch = branch;
    } else {
      this.selectedBranch = null;
    }
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  deleteSelectedBranches(modal): void {
    this.deleteLoading = true;
    this._branchService.deleteBranch(this.deletedIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.deleteLoading = false;
          this.toastr.success("Xóa chi nhánh thành công");
          this.fetchBranchList();
          this.selectedIds = [];
          this.deletedIds = [];
          modal.close();
        } else {
          this.deleteLoading = false;
          this.toastr.error("Xóa chi nhánh thất bại");
          modal.close();
        }
      },
      (error) => {
        this.deleteLoading = false;
        console.error("Có lỗi xảy ra khi xóa chi nhánh", error);
      }
    );
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
        const data = await this._branchService.getDistricts(provinceId).toPromise();
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
        const data = await this._branchService.getWards(districtId).toPromise();
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

  ngOnInit(): void {
    this._branchService.getProvinces().subscribe((response) => {
      this.provinces = response;
    });

    this.fetchBranchList();

    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._branchService.onBranchListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
          }, 450);
        } else {
          this._branchService.onBranchListChanged
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
