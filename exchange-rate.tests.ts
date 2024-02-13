/// <reference path="./types-tests.d.ts" />

// !!!!!!!! ПОКА НЕ ДОДЕЛАНО !!!!!!!!!!

// ---------------------------------------
// ТЕСТЫ -- все тесты интеграционные: открывается транзакция, тест прогоняется, транзакция откатывается
// !!!ЭТАПОМ НОМЕР 3
describe("Проверка курсов на конфликты", () => {
	let er = app.objects.get("er.ExchangeRate");
	let baseData = { ID_Currency: 1, ID_CurrencyExchange: 12 };

	test("Запрашивается подтверждение, когда уже есть курс на сохраняемую дату", () => {
		setupData(er, [ // также можно сделать er.saveBatch([], options) 
				// Важно, чтобы в setupData правила валидации не выполнялись, т.к. сохранение записей на нижнем уровне
			{ DateBegin: new Date("2023-01-02"), DateEnd: null }, 
			{ DateBegin: new Date("2023-01-01"), DateEnd: new Date("2023-01-01") }
		], baseData);

		let saveResult = er.add({ ...baseData, ID_Currency: 1, ID_CurrencyExchange: 12, 
				DateBegin: new Date("2023-01-02"), DateEnd: null })
			//? .save();

		assert(saveResult.confirm);
		assert(saveResult.confirm.code == "er:Conflict"); // если надо
	})

	test("Если уже есть курс с полным совпадением по дате, то такой курс удаляется", () => {
		let records = setupData(er, [ 
			{ DateBegin: new Date("2023-01-01"), DateEnd: new Date("2023-01-01" }
		], baseData);

		let saveResult = er.add({ ...baseData, DateBegin: new Date("2023-01-01"), DateEnd: new Date("2023-01-01") })
			//? .save();

		assert(saveResult.isOk);
		assert(records[0].isDeleted()) // еще у record могут быть isNew(), hasChanges() и т.д.
	})
});
