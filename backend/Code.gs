// Google Apps Script 백엔드
const SECRET_KEY = "edu1234";

// 1. 초기 셋업 함수 (앱스스크립트 에디터에서 직접 1회 실행)
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetsInfo = {
    'Accounts': ['id', 'name', 'institution', 'type', 'balance', 'currency'],
    'Transactions': ['id', 'date', 'amount', 'type', 'fromAccountId', 'toAccountId', 'merchant', 'mainCategory', 'subCategory', 'memo', 'isRecurring'],
    'Budgets': ['categoryId', 'yearMonth', 'targetAmount', 'warningThreshold'],
    'Categories': ['id', 'mainCategory', 'subCategory'],
    'AssetValuations': ['assetId', 'date', 'valuation', 'changeAmount', 'memo'],
    'Recurring': ['id', 'name', 'payDate', 'amount', 'accountId']
  };

  for (const [sheetName, headers] of Object.entries(sheetsInfo)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
    }
  }

  // 초기 카테고리 세팅
  const catSheet = ss.getSheetByName('Categories');
  if (catSheet.getLastRow() <= 1) { // 헤더만 있는 경우
    const initialCategories = [
      ['cat_ex_1', '지출', '고정비'], ['cat_ex_2', '지출', '교통비'], ['cat_ex_3', '지출', '생필품비'],
      ['cat_ex_4', '지출', '식비'], ['cat_ex_5', '지출', '자기개발'], ['cat_ex_6', '지출', '여가'],
      ['cat_ex_7', '지출', '꾸밈비'], ['cat_ex_8', '지출', '의료'], ['cat_ex_9', '지출', '관계비'],
      ['cat_ex_10', '지출', '경조사비'], ['cat_ex_11', '지출', '이벤트비'], ['cat_ex_12', '지출', '기타1'],
      ['cat_in_1', '수입', '급여'], ['cat_in_2', '수입', '상여금'], ['cat_in_3', '수입', '부수입'],
      ['cat_in_4', '수입', '금융소득'], ['cat_in_5', '수입', '더치페이'], ['cat_in_6', '수입', '기타2'],
      ['cat_sv_1', '저축', '청년미래적금'], ['cat_sv_2', '저축', 'CMA'], ['cat_sv_3', '저축', 'ISA'],
      ['cat_sv_4', '저축', '미국투자'], ['cat_sv_5', '저축', '주택청약'], ['cat_sv_6', '저축', '기타3'],
      ['cat_iv_1', '투자', '국내주식'], ['cat_iv_2', '투자', '해외주식'], ['cat_iv_3', '투자', '암호화폐'],
      ['cat_iv_4', '투자', '채권/펀드'], ['cat_iv_5', '투자', '부동산'], ['cat_iv_6', '투자', '기타4']
    ];
    initialCategories.forEach(row => catSheet.appendRow(row));
  }
}

// 2. 단일 doPost로 Webhook 및 CRUD 라우팅 처리
function doPost(e) {
  let requestData;
  try {
    requestData = JSON.parse(e.postData.contents);
  } catch(err) {
    // MacroDroid urlencoded fallback
    requestData = e.parameter;
  }

  // A. MacroDroid Webhook 처리
  if (requestData.secretKey === SECRET_KEY && requestData.appName) {
    return handleMacroDroidWebhook(requestData);
  }

  // B. Frontend CRUD API 처리
  const action = requestData.action;
  const sheetName = requestData.sheetName;
  const data = requestData.data;
  
  if (!action || !sheetName) {
    return createJsonResponse({ error: 'Missing action or sheetName' }, 400);
  }

  try {
    let result;
    switch (action) {
      case 'READ':
        result = readData(sheetName);
        break;
      case 'CREATE':
        result = createData(sheetName, data);
        break;
      case 'UPDATE':
        result = updateData(sheetName, data);
        break;
      case 'DELETE':
        result = deleteData(sheetName, data.id);
        break;
      default:
        return createJsonResponse({ error: 'Invalid action' }, 400);
    }
    return createJsonResponse({ success: true, data: result });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() }, 500);
  }
}

function doGet(e) {
  return createJsonResponse({ message: "Use POST for all CRUD actions to avoid URL length limits and caching issues." });
}

// 헬퍼: JSON 응답 생성
function createJsonResponse(data, code = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 헬퍼: Webhook 처리
function handleMacroDroidWebhook(params) {
  const { appName, title, text } = params;
  let amount = 0;
  let merchant = "알 수 없음";

  // 정규식: 숫자와 콤마 추출 (예: "15,000원 결제" -> 15000)
  const amountRegex = /([0-9,]+)원?/;
  const amountMatch = text.match(amountRegex);
  if (amountMatch) {
    amount = parseInt(amountMatch[1].replace(/,/g, ''));
  }

  // 가맹점/결제수단 기본 파싱 예시 (필요시 상세 앱별 정규식 추가)
  if (appName.includes('토스')) {
    merchant = title || "토스 결제";
  } else if (appName.includes('KB') || appName.includes('국민')) {
    merchant = title || "KB국민카드";
  } else {
    merchant = appName; // fallback
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  const today = new Date().toISOString();
  const uuid = Utilities.getUuid();

  sheet.appendRow([
    uuid, today, amount, 'expense', 'system_auto_account', '', merchant, '지출', '미분류', text, false
  ]);

  return createJsonResponse({ success: true, message: "Webhook processed and inserted to Transactions" });
}

// 헬퍼: CRUD 로직
function readData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function createData(sheetName, item) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(header => item[header] || (header === 'id' ? Utilities.getUuid() : ""));
  sheet.appendRow(rowData);
  return item;
}

function updateData(sheetName, item) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) throw new Error("No id column found");
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === item.id) {
      headers.forEach((header, colIndex) => {
        if (item[header] !== undefined) {
          sheet.getRange(i + 1, colIndex + 1).setValue(item[header]);
        }
      });
      return item;
    }
  }
  throw new Error("Item not found");
}

function deleteData(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idIndex = data[0].indexOf('id');
  if (idIndex === -1) throw new Error("No id column found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      return { id: id };
    }
  }
  throw new Error("Item not found");
}
