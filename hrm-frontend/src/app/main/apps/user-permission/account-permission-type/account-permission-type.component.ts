import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import {
  ColumnMode,
  DatatableComponent,
  SelectionType,
} from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators";

import { CoreConfigService } from "@core/services/config.service";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FlatpickrOptions } from "ng2-flatpickr";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ValidationPatterns } from "common/validation-patterns";
import { Branch } from "shared/models/branch.model";
import { BranchService } from "../../hrm-setting/branch/branch.service";
@Component({
  selector: "app-account-permission-type",
  templateUrl: "./account-permission-type.component.html",
  styleUrls: ["./account-permission-type.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AccountPermissionTypeComponent implements OnInit {
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
  permissions = [
    {
      groupName: "Chi nhánh",
      viewControlName: "viewFacility",
      addControlName: "addFacility",
      editControlName: "editFacility",
      deleteControlName: "deleteFacility",
      customPermissions: [],
    },
    {
      groupName: "Phòng ban",
      viewControlName: "viewService",
      addControlName: "addService",
      editControlName: "editService",
      deleteControlName: "deleteService",
      customPermissions: [],
    },
    {
      groupName: "Chức vụ",
      viewControlName: "viewClass",
      addControlName: "addClass",
      editControlName: "editClass",
      deleteControlName: "deleteClass",
      customPermissions: [],
    },
    {
      groupName: "Nhân viên",
      viewControlName: "viewStudent",
      addControlName: "addStudent",
      editControlName: "editStudent",
      deleteControlName: "deleteStudent",
      customPermissions: [],
    },
    {
      groupName: "Loại chi phí",
      viewControlName: "viewInvoice",
      addControlName: "addInvoice",
      editControlName: "editInvoice",
      deleteControlName: "deleteInvoice",
    },
    {
      groupName: "Chi phí",
      viewControlName: "viewReceipt",
      addControlName: "addReceipt",
      editControlName: "editReceipt",
      deleteControlName: "deleteReceipt",
      customPermissions: [
        { controlName: "approveReceipt", label: "Duyệt chi phí " },
      ],
    },
    {
      groupName: "Tài khoản chi nhánh",
      viewControlName: "viewStudent",
      addControlName: "addStudent",
      editControlName: "editStudent",
      deleteControlName: "deleteStudent",
      customPermissions: [],
    },
  ];

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
  tableTitle: string = "Loại tài khoản";
  columnArray: any[] = [
    {
      header: "mã",
      fieldName: "branchName",
      dataType: "string",
      width: "500px",
    },
    {
      header: "Loại tài khoản",
      fieldName: "address",
      dataType: "string",
      width: "850px",
    },
    {
      header: "Số tài khoản",
      fieldName: "phoneNumber",
      dataType: "string",
      width: "200px",
    },
    { header: "Mô tả", fieldName: "email", dataType: "string", width: "450px" },
  ];

  totalItems: number = 0; // Tổng số bản ghi (lấy từ API)
  itemsPerPage: number = 10; // Số bản ghi mỗi trang
  currentPage: number = 1; // Trang hiện tại
  totalPage: number = 0; // Tổng số trang

  sortColumn: string = "createdAt"; // Cột sắp xếp mặc định
  sortDirection: string = "DESC"; // Hướng sắp xếp mặc định

  @ViewChild("modalBasic") modalBasic: any;
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
      accountTypeName: ["", Validators.required],
      description: [""],
      // Permissions Controls
      viewFacility: [false],
      addFacility: [false],
      editFacility: [false],
      deleteFacility: [false],
      viewService: [false],
      addService: [false],
      editService: [false],
      deleteService: [false],
      viewClass: [false],
      addClass: [false],
      editClass: [false],
      deleteClass: [false],
      viewStudent: [false],
      addStudent: [false],
      editStudent: [false],
      deleteStudent: [false],
      viewInvoice: [false],
      addInvoice: [false],
      editInvoice: [false],
      deleteInvoice: [false],
      approveInvoice: [false],
      collectInvoice: [false],
      viewReceipt: [false],
      addReceipt: [false],
      editReceipt: [false],
      deleteReceipt: [false],
      approveReceipt: [false],
      collectReceipt: [false],
    });
  }

  selectAllPermissions(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.permissions.forEach((permission) => {
      this.form.controls[permission.viewControlName].setValue(checked);
      this.form.controls[permission.addControlName].setValue(checked);
      this.form.controls[permission.editControlName].setValue(checked);
      this.form.controls[permission.deleteControlName].setValue(checked);

      // Handle custom permissions if they exist
      permission.customPermissions?.forEach((custom) => {
        this.form.controls[custom.controlName].setValue(checked);
      });
    });
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchBranchList(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName,
      this.searchByStatus
    );
  }

  // Hàm thay đổi số bản ghi mỗi trang
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchBranchList(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName,
      this.searchByStatus
    );
  }

  // Hàm nhận sự kiện sắp xếp từ void-table.component.ts
  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchBranchList(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName,
      this.searchByStatus
    );
  }

  addBranch() {
    this.openAddModal(this.modalBasic);
  }

  viewBranch(data: any) {
    this.openDetailsModal(this.modalBasic, data);
  }

  editBranch(data: any) {
    this.openEditModal(this.modalBasic, data);
  }

  // Hàm xử lý dữ liệu từ sự kiện onSendSelected
  handleSendSelected(selectedBranches: any[]) {
    const ids = selectedBranches.map((item) => item.id);

    this.deletedIds = ids;

    this.openDeleteModal(this.modalDelete);
    // Thực hiện các xử lý tiếp theo với dữ liệu đã chọn
  }

  deleteBranch(data: any) {
    this.openDeleteModal(this.modalDelete, data);
  }

  filterByStatus(status: any): void {
    if (!status) {
      this.searchByStatus = null;
    } else {
      this.searchByStatus = status.value;
    }
    this.fetchBranchList(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName,
      this.searchByStatus
    );
  }

  onSearch(searchTerm: string): void {
    this.searchByName = searchTerm.trim();

    this.fetchBranchList(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName
    );
  }

  fetchBranchList(
    page: number,
    itemsPerPage: number,
    sortColumn: string,
    sortDirection: string,
    search?: string,
    status?: string
  ): void {
    this.loading = true;
    this._branchService
      .filterBranches(
        page,
        itemsPerPage,
        sortColumn,
        sortDirection,
        search,
        status
      )
      .toPromise() // Converts Observable to Promise
      .then((data: any) => {
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

        this.loading = false;
      })
      .catch((error) => {
        this.toastr.error("Lỗi khi tải dữ liệu chi nhánh", "Lỗi");
        console.error("Có lỗi khi tải danh sách chi nhánh", error);
        this.loading = false;
      });
  }

  onSubmitReactiveForm(modal): void {
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
              this.fetchBranchList(
                this.currentPage,
                this.itemsPerPage,
                this.sortColumn,
                this.sortDirection,
                this.searchByName,
                this.searchByStatus
              );
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
                this.fetchBranchList(
                  this.currentPage,
                  this.itemsPerPage,
                  this.sortColumn,
                  this.sortDirection,
                  this.searchByName,
                  this.searchByStatus
                );
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

  // openDetailsOrUpdateModal(modalRef, branch: Branch, mode: 'view' | 'edit'): void {
  //   this.modalLoading = true;
  //   this.modalMode = mode;
  //   this.selectedBranch = branch;

  //   // Mở modal ngay lập tức và hiển thị trạng thái loading bên trong modal
  //   this.modalService.open(modalRef, {
  //     size: "lg",
  //     backdrop: "static",
  //     keyboard: false,
  //   });

  //   const selectedProvince = this.provinces.find(province => province.name === branch.province);

  //   if (selectedProvince) {
  //     this._branchService.getDistricts(selectedProvince.code).subscribe((districtData) => {
  //       this.districts = districtData.districts;

  //       const selectedDistrict = this.districts.find(district => district.name === branch.district);

  //       if (selectedDistrict) {
  //         this._branchService.getWards(selectedDistrict.code).subscribe((wardData) => {
  //           this.wards = wardData.wards;

  //           const selectedWard = this.wards.find(ward => ward.name === branch.ward);

  //           const detailBranch = {
  //             ...branch,
  //             province: selectedProvince.code,
  //             district: selectedDistrict ? selectedDistrict.code : '',
  //             ward: selectedWard ? selectedWard.code : '',
  //             provinceName: selectedProvince.name || '',
  //             districtName: selectedDistrict.name || '',
  //             wardName: selectedWard.name || '',
  //           };

  //           this.form.patchValue(detailBranch);
  //           this.modalLoading = false; // Khi dữ liệu đã tải xong, tắt trạng thái loading

  //           // Xử lý chế độ view hoặc edit
  //           if (mode === 'view') {
  //             this.form.disable();
  //           } else if (mode === 'edit') {
  //             this.form.enable();
  //           }
  //         });
  //       }
  //     });
  //   } else {
  //     this.modalLoading = false; // Nếu không tìm thấy tỉnh, tắt trạng thái loading
  //   }
  // }

  openDetailsOrUpdateModal(
    modalRef,
    branch: Branch,
    mode: "view" | "edit"
  ): void {
    this.modalLoading = true;
    this.modalMode = mode;
    this.selectedBranch = branch;

    // Mở modal ngay lập tức và hiển thị trạng thái loading bên trong modal
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    // Patch thông tin chung của chi nhánh
    const detailBranch: any = {
      ...branch,
    };

    // Patch giá trị nếu có thông tin về province
    if (branch.province) {
      const selectedProvince = this.provinces.find(
        (province) => province.name === branch.province
      );

      if (selectedProvince) {
        this._branchService
          .getDistricts(selectedProvince.code)
          .subscribe((districtData) => {
            this.districts = districtData.districts;

            const selectedDistrict = this.districts.find(
              (district) => district.name === branch.district
            );

            if (selectedDistrict) {
              this._branchService
                .getWards(selectedDistrict.code)
                .subscribe((wardData) => {
                  this.wards = wardData.wards;

                  const selectedWard = this.wards.find(
                    (ward) => ward.name === branch.ward
                  );

                  // Nếu tìm thấy ward, patch vào form
                  if (selectedWard) {
                    detailBranch.ward = selectedWard.code;
                    detailBranch.wardName = selectedWard.name;
                  }

                  // Patch district nếu có giá trị
                  if (selectedDistrict) {
                    detailBranch.district = selectedDistrict.code;
                    detailBranch.districtName = selectedDistrict.name;
                  }

                  // Patch province nếu có giá trị
                  if (selectedProvince) {
                    detailBranch.province = selectedProvince.code;
                    detailBranch.provinceName = selectedProvince.name;
                  }

                  // Patch tất cả các giá trị vào form
                  Object.keys(detailBranch).forEach((key) => {
                    if (
                      detailBranch[key] !== null &&
                      detailBranch[key] !== undefined
                    ) {
                      this.form.get(key)?.patchValue(detailBranch[key]);
                    }
                  });

                  this.modalLoading = false;
                  if (mode === "view") {
                    this.form.disable();
                  } else if (mode === "edit") {
                    this.form.enable();
                  }
                });
            } else {
              // Nếu không có district hoặc các thông tin khác, patch các trường còn lại
              this.patchRemainingFields(detailBranch, selectedProvince);
            }
          });
      } else {
        // Nếu không có province, patch các trường khác
        this.patchRemainingFields(detailBranch);
      }
    } else {
      // Nếu không có province, chỉ patch các trường còn lại
      this.patchRemainingFields(detailBranch);
    }
  }

  // Hàm để patch các trường còn lại
  patchRemainingFields(detailBranch: any, selectedProvince?: any): void {
    if (selectedProvince) {
      detailBranch.province = selectedProvince.code;
      detailBranch.provinceName = selectedProvince.name;
    }

    // Patch tất cả các giá trị vào form
    Object.keys(detailBranch).forEach((key) => {
      if (detailBranch[key] !== null && detailBranch[key] !== undefined) {
        this.form.get(key)?.patchValue(detailBranch[key]);
      }
    });

    this.modalLoading = false;

    if (this.modalMode === "view") {
      this.form.disable();
    } else if (this.modalMode === "edit") {
      this.form.enable();
    }
  }

  openDetailsModal(modalRef, branch: Branch): void {
    this.openDetailsOrUpdateModal(modalRef, branch, "view");
  }

  openEditModal(modalRef, branch: Branch): void {
    this.openDetailsOrUpdateModal(modalRef, branch, "edit");
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
          this.fetchBranchList(
            this.currentPage,
            this.itemsPerPage,
            this.sortColumn,
            this.sortDirection,
            this.searchByName,
            this.searchByStatus
          );
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

  onProvinceChange(event: any) {
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
      // Gọi API để lấy danh sách quận/huyện
      this._branchService.getDistricts(provinceId).subscribe((data) => {
        this.districts = data.districts;

        this.form.get("district")?.enable();
        this.form.get("district")?.setValue(null);

        this.form.get("ward")?.setValue(null);
        this.form.get("ward")?.disable();
      });
    } else {
      this.form.get("district")?.setValue(null);
      this.form.get("district")?.disable();
      this.form.get("ward")?.setValue(null);
      this.form.get("ward")?.disable();
    }
  }

  onDistrictChange(event: any) {
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
      this._branchService.getWards(districtId).subscribe((data) => {
        this.wards = data.wards;

        this.form.get("ward")?.enable();
        this.form.get("ward")?.setValue(null);
      });
    } else {
      this.form.get("ward")?.setValue(null);
      this.form.get("ward")?.disable();
    }
  }

  // Function to handle ward change
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

    this.fetchBranchList(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName,
      this.searchByStatus
    );

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
