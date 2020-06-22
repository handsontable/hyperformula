# Date and time handling

Date and time formats can be set in the [configuration options](../getting-started/configuration-options.md).

`dateFormats` is a list of formats supported by the parser inside HyperFormula. The default format is `['MM/DD/YYYY', 'MM/DD/YY']`. The separator is ignored and it can be any of the following:  '-' \(dash\), ' ' \(empty space\), '/' \(slash\).

Similarly to `dateFormats`, `timeFormats` is a list of time formats supported by the parser. The default format is`['hh:mm', 'hh:mm:ss.sss']`. The only accepted separator is ':' \(colon\).

### Example with Chinese

```javascript
const options = {
    // add popular date format used in China
    dateFormats: ['yyyy-M-d', 'MM/DD/YYYY', 'MM/DD/YY'],
    // add a custom time format
    timeFormats: ['hh:mm:ss', 'hh:mm', 'hh:mm:ss.sss'],
};
```

### Integration and customization

HyperFormula offers a possibility to extend the number of supported date/time formats and the behavior of this functionality by exposing three options:

* `parseDateTime` which allows for providing a function that accepts a string representing date-time and parting it into an actual date-time format
* `stringifyDateTime`which allows for providing a function that takes the date and prints it as a string
* `stringifyDuration` which allows for providing a function that takes time duration and prints it as a string

To extend the numbers of possible date formats you will need to configure `parseDateTime` . This functionality is based on callbacks and you can customize the formats by integrating a third-party library like [Moment.js](https://momentjs.com/), or by writing your own custom function, like this:

```javascript
 {
  year: number,
  month: number,
  day: number,
 }
```

The configuration of date formats and stringify options may have an impact on how the functions: TEXT, VALUE, and criterions i.e. SUMIF, AVERAGEIF will behave. For instance,  VALUE accepts a string and returns a number - which means, it uses `parseDatetime`. TEXT works the other way round - it accepts a number and returns a string so it will use `stringifyDateTime`. Any change here might give you different results. Criterions do comparisons so they also need to work on strings, dates, etc.

### Moment.js integration

In this example, you will add the possibility to parse dates in `"Do MMM YY"` custom format.

To do so, first, you need to write a function using [Moment.js API](https://momentjs.com/docs/):

```javascript
import moment from "moment";

// write a custom function for parsing dates
export const customParseDate = (dateString, dateFormat) => {
  const momentDate = moment(dateString, dateFormat, true);
  // check validity of a date with moment.js method
  if (momentDate.isValid()) {
    return {
      year: momentDate.year(),
      month: momentDate.month() + 1,
      day: momentDate.date()
    };
  }
  // if the string was not recognized as
  // a valid date return nothing
  return undefined;
};
```

Then, use it inside the [configuration options](../getting-started/configuration-options.md) like so:

```javascript
const options = {
    parseDateTime: customParseDate,
    // you can add more formats
    dateFormats: ["Do MMM YY"]
};
```

After that, you should be able to add a dataset with dates with your custom format:

```javascript
const data = [["31st Jan 00", "2nd Jun 01", "=B1-A1"]];
```

And now the operations on dates are possible since HyperFormula recognizes them as proper dates:

### **Demo**

{% embed url="https://githubbox.com/handsontable/hyperformula-demos/tree/develop/date-time" %}



### Cheatsheet

// tutaj też proponuję zwijaną listę

Below is the cheat sheet with the most popular date formats in different countries.

| Country | Language | Format |
| :--- | :--- | :--- |
| Albania | Albanian | yyyy-MM-dd |
| United Arab Emirates | Arabic | dd/MM/yyyy |
| Argentina | Spanish | dd/MM/yyyy |
| Australia | English | d/MM/yyyy |
| Austria | German | dd.MM.yyyy |
| Belgium | French | d/MM/yyyy |
| Belgium | Dutch | d/MM/yyyy |
| Bulgaria | Bulgarian | yyyy-M-d |
| Bahrain | Arabic | dd/MM/yyyy |
| Bosnia and Herzegovina | Serbian | yyyy-MM-dd |
| Belarus | Belarusian | d.M.yyyy |
| Bolivia | Spanish | dd-MM-yyyy |
| Brazil | Portuguese | dd/MM/yyyy |
| Canada | French | yyyy-MM-dd |
| Canada | English | dd/MM/yyyy |
| Switzerland | German | dd.MM.yyyy |
| Switzerland | French | dd.MM.yyyy |
| Switzerland | Italian | dd.MM.yyyy |
| Chile | Spanish | dd-MM-yyyy |
| China | Chinese | yyyy-M-d |
| Colombia | Spanish | d/MM/yyyy |
| Costa Rica | Spanish | dd/MM/yyyy |
| Cyprus | Greek | dd/MM/yyyy |
| Czech Republic | Czech | d.M.yyyy |
| Germany | German | dd.MM.yyyy |
| Denmark | Danish | dd-MM-yyyy |
| Dominican Republic | Spanish | MM/dd/yyyy |
| Algeria | Arabic | dd/MM/yyyy |
| Ecuador | Spanish | dd/MM/yyyy |
| Egypt | Arabic | dd/MM/yyyy |
| Spain | Spanish | d/MM/yyyy |
| Spain | Catalan | dd/MM/yyyy |
| Estonia | Estonian | d.MM.yyyy |
| Finland | Finnish | d.M.yyyy |
| France | French | dd/MM/yyyy |
| United Kingdom | English | dd/MM/yyyy |
| Greece | Greek | d/M/yyyy |
| Guatemala | Spanish | d/MM/yyyy |
| Hong Kong | Chinese | yyyy年M月d日 |
| Honduras | Spanish | MM-dd-yyyy |
| Croatia | Croatian | dd.MM.yyyy. |
| Hungary | Hungarian | yyyy.MM.dd. |
| Indonesia | Indonesian | dd/MM/yyyy |
| India | Hindi | ३/६/१२ |
| India | English | d/M/yyyy |
| Ireland | Irish | dd/MM/yyyy |
| Ireland | English | dd/MM/yyyy |
| Iraq | Arabic | dd/MM/yyyy |
| Iceland | Icelandic | d.M.yyyy |
| Israel | Hebrew | dd/MM/yyyy |
| Italy | Italian | dd/MM/yyyy |
| Jordan | Arabic | dd/MM/yyyy |
| Japan | Japanese | yyyy/MM/dd |
| Japan | Japanese | H24.MM.dd |
| South Korea | Korean | yyyy. M. d |
| Kuwait | Arabic | dd/MM/yyyy |
| Lebanon | Arabic | dd/MM/yyyy |
| Libya | Arabic | dd/MM/yyyy |
| Lithuania | Lithuanian | yyyy.M.d |
| Luxembourg | French | dd/MM/yyyy |
| Luxembourg | German | dd.MM.yyyy |
| Latvia | Latvian | yyyy.d.M |
| Morocco | Arabic | dd/MM/yyyy |
| Mexico | Spanish | d/MM/yyyy |
| Macedonia | Macedonian | d.M.yyyy |
| Malta | English | dd/MM/yyyy |
| Malta | Maltese | dd/MM/yyyy |
| Montenegro | Serbian | d.M.yyyy. |
| Malaysia | Malay | dd/MM/yyyy |
| Nicaragua | Spanish | MM-dd-yyyy |
| Netherlands | Dutch | d-M-yyyy |
| Norway | Norwegian | dd.MM.yyyy |
| Norway | Norwegian | dd.MM.yyyy |
| New Zealand | English | d/MM/yyyy |
| Oman | Arabic | dd/MM/yyyy |
| Panama | Spanish | MM/dd/yyyy |
| Peru | Spanish | dd/MM/yyyy |
| Philippines | English | M/d/yyyy |
| Poland | Polish | dd.MM.yyyy |
| Puerto Rico | Spanish | MM-dd-yyyy |
| Portugal | Portuguese | dd-MM-yyyy |
| Paraguay | Spanish | dd/MM/yyyy |
| Qatar | Arabic | dd/MM/yyyy |
| Romania | Romanian | dd.MM.yyyy |
| Russia | Russian | dd.MM.yyyy |
| Saudi Arabia | Arabic | dd/MM/yyyy |
| Serbia and Montenegro | Serbian | d.M.yyyy. |
| Sudan | Arabic | dd/MM/yyyy |
| Singapore | Chinese | dd/MM/yyyy |
| Singapore | English | M/d/yyyy |
| El Salvador | Spanish | MM-dd-yyyy |
| Serbia | Serbian | d.M.yyyy. |
| Slovakia | Slovak | d.M.yyyy |
| Slovenia | Slovenian | d.M.yyyy |
| Sweden | Swedish | yyyy-MM-dd |
| Syria | Arabic | dd/MM/yyyy |
| Thailand | Thai | d/M/2555 |
| Thailand | Thai | ๓/๖/๒๕๕๕ |
| Tunisia | Arabic | dd/MM/yyyy |
| Turkey | Turkish | dd.MM.yyyy |
| Taiwan | Chinese | yyyy/M/d |
| Ukraine | Ukrainian | dd.MM.yyyy |
| Uruguay | Spanish | dd/MM/yyyy |
| United States | English | M/d/yyyy |
| United States | Spanish | M/d/yyyy |
| Venezuela | Spanish | dd/MM/yyyy |
| Vietnam | Vietnamese | dd/MM/yyyy |
| Yemen | Arabic | dd/MM/yyyy |
| South Africa | English | yyyy/MM/dd |

