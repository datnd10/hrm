import { CoreMenu } from "@core/types";

export const menu: CoreMenu[] = [
  {
    id: "home",
    title: "Trang chủ",
    translate: "MENU.HOME",
    type: "item",
    icon: "home",
    url: "home",
  },
  {
    id: "hrm-setting",
    title: "Nhân sự ",
    translate: "",
    type: "collapsible",
    icon: "users",
    children: [
      {
        id: "employee",
        title: "employee",
        translate: "Nhân viên",
        type: "item",
        icon: "user",
        url: "/employee/list",
      },
      {
        id: "contract",
        title: "contract",
        translate: "Hợp đồng",
        type: "item",
        icon: "folder",
        url: "/contract/list",
      },
    ],
  },

  {
    id: "finance",
    title: "Tài chính",
    translate: "",
    type: "collapsible",
    icon: "dollar-sign",
    children: [
      {
        id: "salary-costs",
        title: "Salary Costs",
        translate: "Lương",
        type: "item",
        icon: "activity",
        url: "/salary-costs/list",
      },
      {
        id: "expense",
        title: "Expenses",
        translate: "Chi phí khác",
        type: "item",
        icon: "dollar-sign",
        url: "/expense/list",
      },
    ],
  },
  {
    id: "user-permission",
    title: "Người dùng",
    translate: "",
    type: "collapsible",
    icon: "user",
    children: [
      {
        id: "account-permission-type",
        title: "Account-Permission-Type",
        translate: "Loại tài khoản",
        type: "item",
        icon: "shield",
        url: "/account-permission-type/list",
      },
      {
        id: "user",
        title: "User",
        translate: "Người dùng",
        type: "item",
        icon: "users",
        url: "/user/list",
      },
    ],
  },
  //cài đặt
  {
    id: "hrm-setting",
    title: "Cài đặt",
    translate: "",
    type: "collapsible",
    icon: "settings",
    children: [
      {
        id: "organizational-structure",
        title: "Cơ cấu tổ chức",
        translate: "Cơ cấu tổ chức",
        type: "collapsible",
        icon: "grid",
        children: [
          {
            id: "branch",
            title: "Branch",
            translate: "Chi nhánh",
            type: "item",
            icon: "home",
            url: "/branch/list",
          },
          {
            id: "department",
            title: "Department",
            translate: "Phòng Ban",
            type: "item",
            icon: "layers",
            url: "/department/list",
          },
          {
            id: "position",
            title: "Position",
            translate: "Chức vụ",
            type: "item",
            icon: "archive",
            url: "/position/list",
          },
        ],
      },
      {
        id: "finance",
        title: "Tài chính",
        translate: "Tài chính",
        type: "collapsible",
        icon: "dollar-sign",
        children: [
          {
            id: "account-list",
            title: "Account List",
            translate: "Danh sách tài khoản",
            type: "item",
            icon: "list",
            url: "account-list/list",
          },
          {
            id: "expense-type",
            title: "Expense Types",
            translate: "Loại Chi phí",
            type: "item",
            icon: "activity",
            url: "/expense-type/list",
          },
        ],
      },
    ],
  },
];
