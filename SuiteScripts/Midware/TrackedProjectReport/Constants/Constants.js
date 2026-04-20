define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SUITELET_IDS = {
        FORM: {
            TITLE: { LABEL: "Bulk Search" },
            SUBMIT_BUTTON: { LABEL: "Search" },
            FIELDS: {
                PROJECT_SELECT: { LABEL: "Tracked Project", ID: "custpage_tracked_project" },
            },
            TABS: {
                RESULT: { LABEL: "Result", ID: "custpage_mw_sublist_tab" },
            },
        },
        SO_SUBLIST: {
            SUBLIST_ID: "custpage_mw_so_sublist",
            VIEW: "custpage_so_view",
            TRANS_NAME: "custpage_so_name",
            TRANS_CUSTOMER: "custpage_so_customer",
            TRANS_DATE: "custpage_so_date",
            TRANS_TOTAL_WEIGHT: "custpage_so_total_weight",
            TRANS_TOTAL_AMOUNT: "custpage_so_total_amount",
        },
        QUOTES_SUBLIST: {
            SUBLIST_ID: "custpage_mw_quotes_sublist",
            VIEW: "custpage_qt_view",
            TRANS_NAME: "custpage_qt_name",
            TRANS_CUSTOMER: "custpage_qt_customer",
            TRANS_DATE: "custpage_qt_date",
            TRANS_TOTAL_WEIGHT: "custpage_qt_total_weight",
            TRANS_TOTAL_AMOUNT: "custpage_qt_total_amount",
        },
        COMMUNICATION_SUBLIST: {
            SUBLIST_ID: "custpage_mw_communication_sublist",
            VIEW: "custpage_communication_view",
            COMMUNICATION_DATE: "custpage_communication_date",
            COMMUNICATION_TYPE: "custpage_communication_type",
            COMMUNICATION_RECIPIENT: "custpage_communication_recipient",
            COMMUNICATION_MESSAGE: "custpage_communication_message",
        },
    };
});
