/// <reference path="./types-common.d.ts" />

interface Db {
    "er.ExchangeRate": er_ExchangeRate;
    "er.Currency": er_Currency;
    "mdt.Principal": mdt_Principal;
}

interface er_ExchangeRate {
    $id: number;
    ID: number;
    DateBegin: Date;
    DateEnd?: Date;
    FlagActive: boolean;
    FreezeReason: string;
    Value: number;
    ID_Currency: MdtRecord<er_Currency>;
    ID_CurrencyExchange: MdtRecord<er_Currency>;
    ID_FrozenBy: MdtRecord<mdt_Principal>;
}

interface er_Currency {
    Name: string;
}

interface mdt_Principal {
    Code: string;
}
