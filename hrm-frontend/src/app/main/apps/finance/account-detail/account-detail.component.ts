import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ColumnMode } from "@swimlane/ngx-datatable";
@Component({
  selector: "app-account-detail",
  templateUrl: "./account-detail.component.html",
  styleUrls: ["./account-detail.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AccountDetailComponent implements OnInit {
  public ColumnMode = ColumnMode;
  accountId: number;

  constructor(private route: ActivatedRoute) {
    console.log("AccountDetailComponent instantiated");
  }

  transactions = [
    {
      date: "2024-10-10",
      transactionType: "Tiền thu",
      amount: 5000000,
      note: "Lương tháng 10",
    },
    {
      date: "2024-10-05",
      transactionType: "Tiền chi",
      amount: 1500000,
      note: "Mua sắm hàng tạp hóa",
    },
    {
      date: "2024-09-30",
      transactionType: "Tiền thu",
      amount: 2000000,
      note: "Thanh toán dự án tự do",
    },
    {
      date: "2024-09-28",
      transactionType: "Tiền chi",
      amount: 800000,
      note: "Hóa đơn nhà hàng",
    },
    {
      date: "2024-09-25",
      transactionType: "Tiền chi",
      amount: 300000,
      note: "Vé xem phim",
    },
    {
      date: "2024-09-15",
      transactionType: "Tiền thu",
      amount: 1200000,
      note: "Cổ tức chứng khoán",
    },
    {
      date: "2024-09-10",
      transactionType: "Tiền chi",
      amount: 400000,
      note: "Tiền taxi",
    },
    {
      date: "2024-09-05",
      transactionType: "Tiền chi",
      amount: 2500000,
      note: "Tiền thuê nhà",
    },
    {
      date: "2024-09-01",
      transactionType: "Tiền thu",
      amount: 3500000,
      note: "Thưởng từ công việc",
    },
    {
      date: "2024-08-25",
      transactionType: "Tiền chi",
      amount: 450000,
      note: "Hóa đơn tiền điện",
    },
    {
      date: "2024-08-20",
      transactionType: "Tiền thu",
      amount: 1500000,
      note: "Công việc thiết kế tự do",
    },
    {
      date: "2024-08-18",
      transactionType: "Tiền chi",
      amount: 1000000,
      note: "Phụ kiện điện thoại mới",
    },
    {
      date: "2024-08-12",
      transactionType: "Tiền chi",
      amount: 550000,
      note: "Tiền xăng",
    },
    {
      date: "2024-08-05",
      transactionType: "Tiền thu",
      amount: 2200000,
      note: "Lợi nhuận đầu tư",
    },
    {
      date: "2024-08-01",
      transactionType: "Tiền chi",
      amount: 3200000,
      note: "Chi phí kỳ nghỉ",
    },
  ];

  selectedOption = 10; // Default row limit
  loading = false;
  filterUpdate(event: any) {
    // Implement search/filter logic here
  }
  ngOnInit(): void {
    console.log(1);

    // Fetch accountId from route
    this.route.paramMap.subscribe((params) => {
      this.accountId = +params.get("accountId"); // Ensure you get 'accountId'
      console.log("Account ID:", this.accountId); // Verify it's logging correctly
    });
  }
}
