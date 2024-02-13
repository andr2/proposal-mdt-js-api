/// <reference path="./types-app.d.ts" />
// ПРОПОЗАЛ ПРАВИЛ: https://stage3.ics-it.ru/mdt/develop-tests/#/tests/schema/objectRules/rules/value/objectRuleValueTwoFK

// ----------------------------
// JS API
let exchangeRate = app.objects.get("er.ExchangeRate"); 

exchangeRate.onSave(({ object, result, record }) => { // если добавляется, или обновляется. Но не удаляется
	let records = object.fetch({ 
		filter: {	
			ID: { val: record.id, op: "ne" },
			ID_Currency: record.get("ID_Currency"),
			ID_CurrencyExchange: record.get("ID_Currency"), 
			DateBegin: { val: record.get("DateBegin"), op: "gt" }
		}
	});
	let a: MdtRecord<er_ExchangeRate> = <any>null;
	// a = <MdtRecord<er_Currency>><any>null;
	if (!records.length)
		return;
	let confirm = result.confirm("Найдены конфликтующие курсы на ту же дату", { // еще можно чтобы confirm возвращал уникальный ID и подтверждать только его, в контексте операции хранятся все подтвержденные действия
		choices: [ { title: "Обновить курс" } ],
		records: records
	});
	if (!confirm.isConfirmed) 
		return confirm;

	if (records.length > 1) 
		app.log("Found numerous rates on same date {Date}", record.get("DateBegin"));
});


//--------------------------------
// СЕРВЕРНЫЕ ЭКШНЫ -- действия, которые видны в виде кнопок на форме
// обычный экземплярный метод, т.е. по конкретной записи
exchangeRate.actions.add("freeze", {  // или .forRecord() 
	icon: "snowflake",
	title: "Заморозить",
		// code: "Object", 
	paramsObject: { 
		fields: [ 
			{ code: "reason", type: "string" },
			{ code: "user", type: "number" }
		] 
	},
	// ({ builder }) => builder // если указано, то UI сразу запрашивает форму. Можно указать делегат или объект. 
	// 								// Билдер преконфигурен на временный объект с кодом mdt.ExchangeRate.freeze.Params
	// 	.fk("user", app.objects.get("mdt.Principal")) // специализированные метод для FK
	// 	.string("reason"),  // еще доступны простые функции для добавления number, date и др. самые популярные
	canExecute: ({ record }) => record.get("FlagActive") != true, // исполняется на UI: или enabled() или available() ? x
	execute: ({ result, record, params }) => {  // исполняется на сервере

		// если может быть больше 1 подтверждения, то можно их объявлять так
		let c2 = result.confirm("С какого числа вы хотите заменить курс?", {
			choices: [
				{ title: "C сегодня", type: "info", icon: "check", code: "tod" },
				{ title: "За все время", type: "primary", icon: "circle", code: "geb" }
			]
		})
		if (!c2.isConfirmed)
			return c2;
		record.set("ID_FrozenBy", params.get("user"))
		record.set("FreezeReason", params.get("reason"))
		record.set("DateEnd", c2.resolvedCode == "tod" ? new Date() : undefined);
		record.set("FlagActive", false);
	}
});

// СТАТИЧЕСКИЙ экшн, не принимает record
exchangeRate.actions.addStatic("sync", {  
	icon: "rotate",
	title: "Синхронизировать курсы",
	execute: ({}, { http, sdd }) => {
		http.fetch("cbr.ru/exchangeRates")
			.map(x => {
				// add создает record, резолвит типы в значениях в красивые (в т.ч. FK ищет по натуральному ключу), добавляет запись в dbContext
				// запись автоматически добавляется (если dbContext, то в конце транзакции, если не было ошибок)
				exchangeRate.add({ ID_Currency: "USD", DateBegin: new Date(), Value: x.Valute.USD.Value }); 
			}) 
	}
});
// ПАКЕТНЫЙ экшн, приходит список записей (иногда полезно чтобы быстро отработало в рамках одного действия)
exchangeRate.actions.addBatch("archive", {
	title: "Заархивировать",
	type: "warning",
	execute: ({ records, action, result }) => {
		let c1 = result.prompt("Записей слишком много. Требуется заполнить обоснование", action.objects.reasonDetails) // еще вариант на prompt кидать эксепшн
		if (records.length > 10 && !c1.isResolved) 
			return c1;
		records.map(r => {
			r.set("FlagArchive", true);
			if (c1.isResolved) 
				r.set("ArchiveReason", c1.resolvedRecord.get("reason"))
		})
		app.log.warn("Выполнена заморозка с изменением параметров заменяемой записи", { description: c1.resolvedRecord.get("description") })
	},
	objects: {
		reasonDetails: { 
			reason: { type: "string", required: false } // или builder.string("reason", { required: false }) ?
		}
	}
});

// -----------------------------
// ПРАВИЛА -- все как раньше, только object.rules. вместо $mdt.rules
// // ЭТАПОМ НОМЕР 2
// exchangeRate.rules.validate("Дата окончания должна быть позже даты начала",  
// 	({ record }) => record.get("DateBegin") < record.get("DateEnd"), 
// 	{ fields: ["DateBegin", "DateEnd"]}); 

// ---------------------------------------
// ТЕСТЫ -- все тесты интеграционные: открывается транзакция, тест прогоняется, транзакция откатывается
// ЭТАПОМ НОМЕР 3
// describe("Проверка курсов на конфликты", () => {
// 	let exchangeRate = objects.get("er.ExchangeRate");
// 	let baseData = { ID_Currency: 1, ID_CurrencyExchange: 12 };

// 	test("Запрашивается подтверждение, когда уже есть курс на сохраняемую дату", (db) => {
// 		setupData(rateObject, () => [ // также можно сделать er.saveBatch([], options) 
// 				// Важно, чтобы в setupData правила валидации не выполнялись, т.к. сохранение записей на нижнем уровне
// 			{ DateBegin: "2023-01-02", DateEnd: null }, 
// 			{ DateBegin: "2023-01-01", DateEnd: "2023-01-01" }
// 		], baseData);

// 		let saveResult = exchangeRate.new({ ...baseData, ID_Currency: 1, ID_CurrencyExchange: 12, DateBegin: "2023-01-02", DateEnd: null })
// 			.save();

// 		assert(saveResult.confirm);
// 		assert(saveResult.confirm.code == "er:Conflict"); // если надо
// 	})

// 	test("Если уже есть курс с полным совпадением по дате, то такой курс удаляется", () => {
// 		let records = setupData(rateObject, [ 
// 			{ DateBegin: "2023-01-01", DateEnd: "2023-01-01" }
// 		], baseData);

// 		let saveResult = er.new({ ...baseData, DateBegin: "2023-01-01", DateEnd: "2023-01-01" })
// 			.save();

// 		assert(saveResult.isOk);
// 		assert(records[0].isDeleted()) // еще у record могут быть isNew(), hasChanges() и т.д.
// 	})
// });

// ---------------------------------------
// JSON-ответ
let restResponse = {
	blocks: [
		{
			content: [ 
				{ _type: "markdown", content: "Hello!" },
				{ _type: "records", // или list?
					listView: "list view code", // необязательное поле
					// обязательное действие или нет
					// выбор из нескольких
					object: "tpm.Contract",
					data: [
						{ $id: 1231, $actions: [ { /*...*/ } ], Title: "Трудовой договор" } // dropdown
					],
				},
				{ _type: "markdown", content: "Hello2" },
				{ _type: "actions", items: [ { /*...*/ } ] }, // dropdown | radio
			]
		}
	],
	actions: [ // отображается в виде кнопок снизу окна подтверждения
		{ title: "Подтвердить", icon: "check" }
	]
}

// -------------------------------
// UI

// Как может выглядеть UI: двухпанельный интерфейс: JS с правилами, JS тестов
// В тестовой панели: доступны тестовые методы - describe, test и т.д., снизу правой панели - консоль с выводом тестов
// В тулбаре: кнопка запуска тестов, слева меню "Сниппеты правил", справа "Сниппеты тестов"

// При нажатии на Снипеты - открывается модальное окно с двумя панелями - древовидный список сниппетов, справа код выбранного сниппета. 
// Снизу кнопка вставить сниппет.
// Важно чтобы сниппеты рассматривались как кукбук, т.е. примеры решений типовых задач. 




