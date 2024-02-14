// in module
// _db.Subscribe<ExchangeUpdateEventHandler>("er.ExchangeRate", UpdateType.Insert | UpdateType.Update);
public class ExchangeUpdateEventHandler : IUpdateEventHandler
{
	private readonly IDataRepository _rep;
	private readonly ILogger<ExchangeRateEventHandler> _logger;

	public ExchangeUpdateEventHandler(IDataRepository rep, ILogger<ExchangeRateEventHandler> logger)
	{
		_rep = rep;
		_logger = logger;
	}

	public void Handle(UpdateEventArgs args)
	{
		var record = args.Record;
		var records = _rep.GetList("er.ExchangeRate", Filter.Ne("ID", record.Id)
					 & Filter.Eq("ID_Currency", record["ID_Currency"])
					 & Filter.Eq("ID_CurrencyExchange", record["ID_Currency"])
					 & Filter.Gt("DateBegin", record["DateBegin"]);

		if (records.Count == 0)
			return;

		var confirm = args.Result.Confirm("Найдены конфликтующие записи на ту же дату", new {
			Refs: records.Select(r => new(args.Table, r.Id)),
			Choices: new[] {new("Обновить курс")}
		}));			

		if (!confirm.IsConfirmed())
			confirm.Prompt();

		if (records.Count > 0)
			_logger.Warning("Found numerous rates on same date {Date}", record["DateBegin"])
	}
}