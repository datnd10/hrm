import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import {
  ColumnMode,
  DatatableComponent,
  SelectionType,
} from "@swimlane/ngx-datatable";
import { Subject } from "rxjs";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreConfigService } from "@core/services/config.service";
import { ToastrService } from "ngx-toastr";
import { takeUntil } from "rxjs/operators";
import { JobsService } from "./jobs.service";

@Component({
  selector: "app-jobs",
  templateUrl: "./jobs.component.html",
  styleUrls: ["./jobs.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class JobsComponent implements OnInit {
  public rows;
  public ColumnMode = ColumnMode;
  public cols: any[];
  public selectedJobs: any;
  public modalRef: any;
  public jobsArray = [];
  public formLoading: boolean = false;

  public modalMode: "add" | "edit" | "view" = "add";
  public selectedJob: any = null;

  // Decorator
  @ViewChild(DatatableComponent) table: DatatableComponent;

  totalItems: number = 0; // Tổng số bản ghi (lấy từ API)
  itemsPerPage: number = 10; // Số bản ghi mỗi trang
  currentPage: number = 1; // Trang hiện tại
  totalPage: number = 0; // Tổng số trang

  sortColumn: string = "createdAt"; // Cột sắp xếp mặc định
  sortDirection: string = "DESC"; // Hướng sắp xếp mặc định

  public selectedItems: any[] = [];

  @ViewChild("modalBasic") modalBasic: any;
  @ViewChild("modalDelete") modalDelete: any;

  public deletedIds = [];
  public modalLoading: boolean = false;

  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;

  private form: any;
  public loading: boolean = false;
  constructor(
    private _jobsService: JobsService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
  }
  searchByStatus: string = null;
  searchByName: string = "";
  statusOptions: any[] = [
    { name: "Thành công", value: "COMPLETED" },
    { name: "Thất bại", value: "FAILED" },
  ];

  formulaTypeOptions: any[] = [
    { name: "Lương cơ bản", value: "BASE_SALARY" },
    { name: "Chi phí cố định theo đơn giá", value: "FIXED_COST" },
    { name: "Chi phí biến động", value: "VARIABLE_COST" },
    { name: "Chi phí định mức", value: "TIERED_COST" },
  ];

  tableTitle: string = "Lịch sử import";
  columnArray: any[] = [
    {
      header: "Tên job",
      fieldName: "name",
      dataType: "string",
      width: "750px",
    },
    {
      header: "Loại",
      fieldName: "type",
      dataType: "string",
      width: "750px",
    },
    {
      header: "Thời gian",
      fieldName: "createdAt",
      dataType: "string",
      width: "400px",
    },
    {
      header: "Trạng thái",
      fieldName: "status",
      dataType: "string",
      width: "400px",
    },
  ];


  filterByCategory(category: any): void {
    if (!category) {
      this.searchByStatus = null;
    } else {
      this.searchByStatus = category.value;
    }

    this.fetchJob(
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

    this.fetchJob(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName
    );
  }
  fetchJob(
    page: number,
    itemsPerPage: number,
    sortColumn: string,
    sortDirection: string,
    search?: string,
    status?: string
  ): void {
    this.loading = true;
    this._jobsService
      .filterJob(
        page,
        itemsPerPage,
        sortColumn,
        sortDirection,
        search,
        status
      )
      .toPromise()
      .then((data: any) => {
        this.jobsArray = data?.data?.items;

        this.totalItems = data?.data?.meta.totalItems;
        this.currentPage = data?.data?.meta.currentPage;
        this.itemsPerPage = data?.data?.meta.itemsPerPage;
        this.totalPage = data?.data?.meta.totalPages;
        this.loading = false;
      })
      .catch((error) => {
        this.toastr.error("Lỗi khi tải dữ liệu ", "Lỗi");
        console.error("Có lỗi khi tải danh sách loại chi phí", error);
        this.loading = false;
      });
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.fetchJob(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName
    );
  }

  // Hàm thay đổi số bản ghi mỗi trang
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchJob(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName
    );
  }

  // Hàm nhận sự kiện sắp xếp từ void-table.component.ts
  onSortChange(sortInfo: { column: string; direction: string }) {
    this.sortColumn = sortInfo.column;
    this.sortDirection = sortInfo.direction;
    this.fetchJob(
      this.currentPage,
      this.itemsPerPage,
      this.sortColumn,
      this.sortDirection,
      this.searchByName
    );
  }


  viewJob(data: any) {
    this.openDetailsModal(this.modalBasic, data);
  }

  openDetailsModal(modalRef, job: any): void {
    this.openDetailsOrUpdateModal(modalRef, job, "view");
  }

  openDetailsOrUpdateModal(
    modalRef,
    job: any,
    mode: "view" | "edit"
  ): void {
    this.modalLoading = true; // Hiển thị trạng thái đang tải
    this.modalMode = mode;   // Gán chế độ xem hoặc chỉnh sửa
    this.selectedJob = null; // Xóa dữ liệu cũ để tránh hiển thị nhầm
    this.modalRef = this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    // Gọi API để lấy dữ liệu chi tiết
    this._jobsService.getOnejob(job.id).toPromise()
      .then((response: any) => {
        if (response?.data) {
          this.selectedJob = response.data; // Gán dữ liệu vào selectedJob
        } else {
          console.warn("No data received for job ID:", job.id);
        }
      })
      .catch((error: any) => {
        console.error("Error fetching job details:", error);
      })
      .finally(() => {
        // Đảm bảo tắt modalLoading trong mọi trường hợp (có hoặc không có lỗi)
        this.modalLoading = false;
      });
  }

  ngOnInit(): void {
    this.fetchJob(
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
        //! If we have zoomIn route Transition then load datatable after 450ms(Transition will finish in 400ms)
        if (config.layout.animation === "zoomIn") {
          this._jobsService.onJobListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
              this.rows = response;
              this.tempData = this.rows;
            });

        } else {

        }
      });
    // Đảm bảo mảng không bị undefined
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
