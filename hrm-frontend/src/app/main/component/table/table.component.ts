import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import * as feather from "feather-icons";
@Component({
  selector: "app-table",
  templateUrl: "./table.component.html",
  styleUrls: ["./table.component.scss"],
})
export class TableComponent implements OnChanges {
  @Input() tableData: any[] = [];
  @Input() columnArray: any[] = [];
  @Input() showActionButton: boolean = false;
  @Input() showChangeStatusButton: boolean = false;
  @Input() totalItems: number = 0; // Tổng số bản ghi từ backend
  @Input() itemsPerPage: number = 2; // Số bản ghi mỗi trang
  @Input() currentPage: number = 1; // Trang hiện tại
  @Input() totalPages: number = 0; // Tổng số trang

  @Output() onPageChange = new EventEmitter<number>(); // Emit khi chuyển trang
  @Output() onItemsPerPageChange = new EventEmitter<number>(); // Emit khi thay đổi số bản ghi mỗi trang
  @Output() onSortChange = new EventEmitter<{
    column: string;
    direction: string;
  }>(); // Thêm sự kiện để gửi sort

  @Output() onDelete: EventEmitter<any> = new EventEmitter();
  @Output() onEdit: EventEmitter<any> = new EventEmitter();
  @Output() onView: EventEmitter<any> = new EventEmitter();
  @Output() onApprove: EventEmitter<any> = new EventEmitter();
  @Output() onReject: EventEmitter<any> = new EventEmitter();
  @Output() onSelectedItemsChange = new EventEmitter<any[]>();

  sortColumn: string = ""; // Cột hiện tại đang sắp xếp
  sortDirection: string = ""; // Hướng sắp xếp, 'asc' hoặc 'desc'

  pagesArray: number[] = []; // Mảng chứa các số trang  // Tổng số trang

  selectAll: boolean = false;

  constructor() { }

  // Hook chạy khi view đã render xong
  ngAfterViewChecked() {
    feather.replace(); // Khởi tạo lại Feather Icons
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.selectAll = false;
    this.calculateTotalPages(); // Tính toán lại số trang khi `totalItems` hoặc `itemsPerPage` thay đổi
  }


  emitSelectedItems() {
    const selectedDatas = this.getSelectedDatas();
    this.onSelectedItemsChange.emit(selectedDatas); // Emit danh sách item đã chọn
  }

  toggleSelectAll() {
    this.tableData.forEach((data) => {
      data.isChecked = this.selectAll;
    });
    this.emitSelectedItems();
  }

  // Lấy danh sách các bản ghi đã được chọn
  getSelectedDatas() {
    const selectedDatas = this.tableData.filter((data) => data.isChecked);
    return selectedDatas;
  }

  toggleSelectSingle() {
    this.selectAll = this.tableData.every((data) => data.isChecked);
    this.emitSelectedItems(); // Emit danh sách item đã chọn
  }

  anySelected(): boolean {
    return this.tableData.some((data) => data.isChecked);
  }

  // Tính toán tổng số trang và cập nhật mảng các số trang
  calculateTotalPages() {
    // this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const maxVisiblePages = 5; // Số lượng trang tối đa hiển thị cùng lúc
    const pages = [];

    // Hiển thị trang đầu tiên
    if (this.totalPages > 0) pages.push(1);

    // Hiển thị các trang xung quanh trang hiện tại
    const startPage = Math.max(this.currentPage - 2, 2);
    const endPage = Math.min(this.currentPage + 2, this.totalPages - 1);

    if (startPage > 2) {
      pages.push('...'); // Dấu ...
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < this.totalPages - 1) {
      pages.push('...'); // Dấu ...
    }

    // Hiển thị trang cuối cùng
    if (this.totalPages > 1) pages.push(this.totalPages);

    this.pagesArray = pages;
  }

  // Khi thay đổi trang
  pageChanged(page: number) {
    if (page !== this.currentPage) {
      this.onPageChange.emit(page); // Emit sự kiện chuyển trang ra ngoài để gọi API
    }
  }

  // Khi thay đổi số bản ghi mỗi trang
  changeItemsPerPage() {
    this.currentPage = 1; // Reset lại trang khi thay đổi số bản ghi mỗi trang
    this.onItemsPerPageChange.emit(this.itemsPerPage); // Emit sự kiện thay đổi số bản ghi
    this.selectAll = false; // Bỏ chọn "chọn tất cả" khi thay đổi itemsPerPage
    this.tableData.forEach((data) => (data.isChecked = false)); // Bỏ chọn từng ô checkbox
  }


  viewRecord(item: any) {
    this.onView.emit(item);
  }

  editRecord(item: any) {
    this.onEdit.emit(item);
  }

  deleteRecord(item: any) {
    this.onDelete.emit(item);
  }

  approveRecord(item: any) {
    this.onApprove.emit(item);
  }

  rejectRecord(item: any) {
    this.onReject.emit(item);
  }

  // Chuyển đến trang trước
  goToPreviousPage(event: any) {
    event.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
    if (this.currentPage > 1) {
      this.pageChanged(this.currentPage - 1);
    }
  }

  // Chuyển đến trang tiếp theo
  goToNextPage(event: any) {
    event.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
    if (this.currentPage < this.totalPages) {
      this.pageChanged(this.currentPage + 1);
    }
  }

  // Chuyển đến một trang cụ thể
  goToPage(event: any, page: number) {
    event.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
    this.pageChanged(page);
  }
  sortTable(column: string, direction: string) {
    this.sortColumn = column;
    this.sortDirection = direction;

    // Gửi sự kiện sắp xếp đến backend
    this.onSortChange.emit({
      column: this.sortColumn,
      direction: this.sortDirection,
    });
  }
}
