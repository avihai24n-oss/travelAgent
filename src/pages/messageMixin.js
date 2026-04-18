import { DAYS, MONTHS, CLASSES_TYPE_MAP } from "src/assets/consts.js";
import { airlines } from "src/assets/airlines_big.js";
import index from "airportsjs";
import { airports } from "src/assets/iata";

// destructuring to keep only what is needed

const messageMixin = {
  methods: {
    init() {
      if (
        "contacts" in navigator &&
        "select" in navigator.contacts &&
        "getProperties" in navigator.contacts
      ) {
        this.contactListApiSupported = true;
      }

      if (!String.prototype.splice) {
        /**
         * {JSDoc}
         *
         * The splice() method changes the content of a string by removing a range of
         * characters and/or adding new characters.
         *
         * @this {String}
         * @param {number} start Index at which to start changing the string.
         * @param {number} delCount An integer indicating the number of old chars to remove.
         * @param {string} newSubStr The String that is spliced in.
         * @return {string} A new string with the spliced substring.
         */
        String.prototype.splice = function(start, delCount, newSubStr) {
          return (
            this.slice(0, start) +
            newSubStr +
            this.slice(start + Math.abs(delCount))
          );
        };
      }
    },
    async selectFromPhoneContactList() {
      if (this.contactListApiSupported) {
        try {
          const availableProperties = await navigator.contacts.getProperties();

          if (availableProperties.includes("address")) {
            const contactProperties = ["name", "tel", "address"];

            const contacts = await navigator.contacts.select(
              contactProperties,
              { multiple: false }
            );

            this.data.whatsappNumber = contacts[0].tel;
            this.data.travelers[0].name = `${contacts[0].name}`;
          } else {
            console.log(
              "Contact Picker API on your device doesn't support address property"
            );
          }
        } catch {
          console.log("Unexpected error happened in Contact Picker API");
        }
      } else {
        console.log("Your browser doesn't support Contact Picker API");
      }
    },
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    onRedirectToWhatsapp() {
      const url = `https://api.whatsapp.com/send?phone=${
        this.data.whatsappNumber
      }&text=%20${encodeURIComponent(this.whatsappMessage)}`;
      window.open(url, "_blank");
    },
    getAmadeusTranslate(linesString) {
      if (linesString.length) {
        let lines,
          splited,
          nextLineSplited,
          hoursDifference = 0,
          way,
          txt = "";

        //             ? this.$t("other destination flight")

        lines = linesString.split("\n");
        let nextLine;

        lines.forEach((line, idx) => {
          splited = this.getSplittedLine(line);
          nextLineSplited = this.getSplittedLine(lines[idx + 1]);

          line = this.getSplitedLineDetails(splited);

          if (idx === 0) {
            this.firstDepart = line.departAirport;
          }

          if (nextLineSplited)
            nextLine = this.getSplitedLineDetails(nextLineSplited);

          if (nextLine) {
            hoursDifference = this.getHourDifference(line, nextLine);
            if (idx === 0) {
              way = this.$t("outbound flight");
              txt += `*${way}*`;
            }
          }
          
          const departAirport =
            this.selectedLang === "he"
              ? airports[line.departAirportCode]
                ? airports[line.departAirportCode].CityNameHe
                : line.departAirport
              : line.departAirport;

          const destAirport =
            this.selectedLang === "he"
              ? airports[line.destAirportCode]
                ? airports[line.destAirportCode].CityNameHe
                : line.destAirport
              : line.destAirport;

          var flightPrefix = this.$i18n.locale === 'he' ? '' : this.prefixFlight;
          var flightDash = this.$i18n.locale === 'he' ? ' – ' : ' - ';
          var classLine = this.$i18n.locale === 'he' ? '' : ('\n' + this.$t(this.$t(line.flightClass)));

          var isHe = this.$i18n.locale === 'he';
          var sp = isHe ? '' : ' ';

          txt += `\n${flightPrefix}${line.airline}${flightDash}*${
            line.flightNumber
          }* \n${departAirport} ${
            line.departAirport === "Tel Aviv"
              ? `${this.directionEmoji} `
              : `(${line.departAirportCode}) ${this.directionEmoji} `
          }${destAirport} ${
            line.destAirport === "Tel Aviv" ? "" : `(${line.destAirportCode})`
          }${classLine}\n${sp}${this.$t(
            "dpt."
          )} ${this.$t(`${line.departDay}`)}${this.getRightSpaceAlignment(
            line.departDay
          )} ${line.departDateNumberOnlyStr} ${this.$t(
            line.departMonth
          )}${this.getRightSpaceAlignment(line.departMonth)} ${
            line.departTime
          }\n${sp}${this.$t("arr.")} ${this.$t(
            `${line.destDay}`
          )}${this.getRightSpaceAlignment(line.destDay)} ${
            line.destDateNumberStr
          } ${this.$t(line.destMonth)}${this.getRightSpaceAlignment(
            line.destMonth
          )} ${line.destTime}\n${this.$t("seat number")}\n`;

          if (24 < hoursDifference) {
            if (way.includes(this.$t("inbound flight"))) {
              txt = txt.replace(
                `${this.$t("inbound flight")}`,
                `${this.$t("other destination flight")}`
              );
            }
            way = this.$t("inbound flight");
            txt += `\n*${way}*`;
          }
        });
        return txt;
      } else return "";
    },
    getParsedFlights(linesString) {
      if (!linesString || !linesString.length) return [];
      const out = [];
      linesString.split("\n").forEach(raw => {
        const splited = this.getSplittedLine(raw);
        if (!splited || splited.length < 11) return;
        const airlineCode = splited[1];
        if (!airlines.filter(a => a.IATA === airlineCode)[0]) return;
        try {
          const line = this.getSplitedLineDetails(splited);
          if (!line) return;
          line.airlineCode = airlineCode;
          const flightAirport =
            this.selectedLang === "he"
              ? airports[line.departAirportCode] &&
                airports[line.departAirportCode].CityNameHe
                ? airports[line.departAirportCode].CityNameHe
                : line.departAirport
              : line.departAirport;
          const flightDestAirport =
            this.selectedLang === "he"
              ? airports[line.destAirportCode] &&
                airports[line.destAirportCode].CityNameHe
                ? airports[line.destAirportCode].CityNameHe
                : line.destAirport
              : line.destAirport;
          line.departAirportLocal = flightAirport;
          line.destAirportLocal = flightDestAirport;
          out.push(line);
        } catch (e) {
          // skip malformed lines
        }
      });
      return out;
    },
    getSplitedLineDetails(splitedLine) {
      if (!splitedLine) return;
      let line = {},
        latterOfclassOfTravel,
        dayNumber;

      latterOfclassOfTravel = splitedLine[3];
      line.flightClass = this.setClassOfTravel(latterOfclassOfTravel);
      const airlineMatch = airlines.filter(item => {
        return item.IATA === splitedLine[1];
      })[0];
      line.airline = airlineMatch ? airlineMatch.name : splitedLine[1];
      line.flightNumber = `${splitedLine[1]}${splitedLine[2]}`;
      dayNumber = splitedLine[5];
      line.departAirportCode = splitedLine[6].slice(0, 3);
      line.destAirportCode = splitedLine[6].slice(3, 6);
      this.data.journey.push(
        index.lookupByIataCode(line.departAirportCode).city
      );
      this.data.journey.push(index.lookupByIataCode(line.destAirportCode).city);
      if (!this.data.journeyCodes) this.data.journeyCodes = {};
      this.data.journeyCodes[index.lookupByIataCode(line.departAirportCode).city] = line.departAirportCode;
      this.data.journeyCodes[index.lookupByIataCode(line.destAirportCode).city] = line.destAirportCode;
      line.departAirport = `${
        index.lookupByIataCode(line.departAirportCode).city
      }`;
      line.destAirport = `${index.lookupByIataCode(line.destAirportCode).city}`;
      line.departTime = `${splitedLine[8].slice(0, 2)}:${splitedLine[8].slice(
        2,
        4
      )}`;
      line.destTime = `${splitedLine[9].slice(0, 2)}:${splitedLine[9].slice(
        2,
        4
      )}`;
      line.departDate = `${splitedLine[4]}`;
      line.destDate = `${splitedLine[10]}`;
      line.departDay = DAYS[dayNumber - 1];

      // * day logic
      line.departDateNumberOnlyStr = line.departDate.substr(0, 2);
      line.departDateNumberOnly = +line.departDate.substr(0, 2);
      line.destDateNumberStr = line.destDate.substr(0, 2);
      line.destDateNumberOnly = +line.destDate.substr(0, 2);
      line.destMonth = line.destDate.substr(2, 5);
      line.departMonth = line.departDate.substr(2, 5);
      line.destHour = line.destTime.substr(0, 2);
      line.destMinutes = line.destTime.substr(3, 5);
      line.departHour = line.departTime.substr(0, 2);
      line.departMinutes = line.departTime.substr(3, 5);

      if (line.departMonth === line.destMonth) {
        line.destDay =
          line.departDateNumberOnly !== line.destDateNumberOnly
            ? line.departDateNumberOnly < line.destDateNumberOnly
              ? DAYS[+dayNumber === 7 ? 0 : +dayNumber]
              : // * in case dayNumber is mon (1) in js [0] and the previos day is sun (7) in js [6]
              +dayNumber === 1
              ? DAYS[6]
              : DAYS[dayNumber - 2]
            : line.departDay;
      } else if (
        MONTHS.indexOf(line.departMonth) > MONTHS.indexOf(line.destMonth)
      ) {
        // * in case dayNumber is mon (1) in js [0] and the previos day is sun (7) in js [6]
        line.destDay = +dayNumber === 1 ? DAYS[6] : DAYS[dayNumber - 2];
      } else {
        line.destDay = DAYS[+dayNumber === 7 ? 6 : +dayNumber];
      }
      //

      return line;
    },
    getSplittedLine(line) {
      if (!line) return;
      let charsToFirstNumber;
      charsToFirstNumber = line.search(/\d/);
      line = line.slice(charsToFirstNumber, line.length - 1);
      // * handles 4 numbers - ly1996
      line = line.splice(5, 0, " ");
      // * handle * - 4*
      line = line.splice(20, 1, " ");

      return line.split(/(\s+)/).filter(e => e.trim().length > 0);
    },
    setClassOfTravel(latterOfclassOfTravel) {
      let isInClass = false,
        flightClass;
      for (const key in CLASSES_TYPE_MAP) {
        isInClass = CLASSES_TYPE_MAP[key].some(
          latter => latter === latterOfclassOfTravel
        );
        if (isInClass) {
          flightClass = key;
          if (this.data.classOfTravel && this.data.classOfTravel !== key) {
            this.data.classOfTravel = "combined compartment";
          } else this.data.classOfTravel = key;
        }
      }
      return flightClass;
    },
    getHourDifference(line, nextLine) {
      let currYear = new Date().getFullYear(),
        destFormattedDate = new Date(),
        nextLineDepartFormattedDate = new Date();

      destFormattedDate.setFullYear(currYear);
      destFormattedDate.setMonth(MONTHS.indexOf(line.destMonth));
      destFormattedDate.setDate(line.destDateNumberOnly);
      destFormattedDate.setHours(line.destHour);
      destFormattedDate.setMinutes(line.destMinutes);
      nextLineDepartFormattedDate.setFullYear(currYear);
      nextLineDepartFormattedDate.setMonth(
        MONTHS.indexOf(nextLine.departMonth)
      );
      nextLineDepartFormattedDate.setDate(nextLine.departDateNumberOnly);
      nextLineDepartFormattedDate.setHours(nextLine.departHour);
      nextLineDepartFormattedDate.setMinutes(nextLine.departMinutes);

      const difference =
        nextLineDepartFormattedDate.getTime() - destFormattedDate.getTime();
      const hoursDifference = Math.floor(difference / 1000 / 60 / 60);

      return hoursDifference;
    },
    getRightSpaceAlignment(str) {
      str = this.$t(str).toLowerCase();
      switch (str) {
        // * en
        case "sun":
          return " ";
        case "tue":
          return " ";
        case "thu":
          return " ";
        case "fri":
          return "   ";
        case "sat":
          return "  ";
        // * fr
        case "dim":
          return " ";
        case "lun":
          return " ";
        case "mer":
          return " ";
        case "jeu":
          return " ";
        case "ven":
          return " ";
        case "sam":
          return "";
        // * he
        case "יום א":
          return "";
        case "יום ב":
          return "";
        case "יום ג":
          return "";
        case "יום ד":
          return "";
        case "יום ה":
          return "";
        case "יום ו":
          return " ";
        case "יום ש":
          return "";
        case "ינו'":
          return "   ";
        case "פבר'":
          return "";
        case "מרץ":
          return " ";
        case "אפר'":
          return "";
        case "מאי":
          return " ";
        case "יוני":
          return "  ";
        case "יולי":
          return "  ";
        case "אוג'":
          return "";
        case "ספט'":
          return "";
        case "אוק'":
          return " ";
        case "נוב'":
          return "  ";
        case "דצמ'":
          return "";

        // * months
        case "jan":
          return "";
        case "feb":
          return " ";
        case "mar":
          return "";
        case "apr":
          return " ";
        case "may":
          return "";
        case "jun":
          return " ";
        case "jul":
          return " ";
        case "aug":
          return "";
        case "sep":
          return " ";
        case "oct":
          return "";
        case "nov":
          return " ";
        case "dec":
          return "";

        default:
          return "";
      }
    }
  },
  computed: {
    directionEmoji() {
      return this.$i18n.locale === "he" ? "⬅️" : "➡️";
    },
    prefixFlight() {
      return this.$i18n.locale === "he" ? "טיסת " : "";
    }
  }
};
export default messageMixin;
