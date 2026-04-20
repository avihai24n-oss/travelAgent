<template>
  <q-page class="page-wrapper">
    <!-- Header -->
    <q-header class="modern-header">
      <q-toolbar class="toolbar-main">
        <q-toolbar-title class="app-title">
          <span class="title-icon">&#9992;</span>
          Travel Agent Gad Elnekave
        </q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="settings"
          color="white"
          size="sm"
          aria-label="Admin"
          @click="$router.push('/admin')"
        />
        <q-toggle
          v-model="darkMode"
          dark
          color="amber"
          icon="brightness_6"
          size="sm"
        />
      </q-toolbar>
      <q-tabs
        v-model="tab"
        class="header-tabs"
        narrow-indicator
        dense
        active-color="white"
        indicator-color="white"
        align="justify"
      >
        <q-tab name="info" icon="edit" label="Build" no-caps />
        <q-tab @click="onPreview" name="preview" icon="visibility" label="Preview" no-caps />
      </q-tabs>
    </q-header>

    <!-- BUILD TAB -->
    <div v-if="tab === 'info'" class="content-area">
      <!-- Contact -->
      <div class="section-card">
        <div class="section-header">
          <span class="section-icon">&#128222;</span>
          <span>Contact</span>
        </div>
        <div class="section-body row-flex">
          <q-input
            v-model="data.whatsappNumber"
            label="WhatsApp Number"
            outlined
            dense
            class="flex-grow"
          >
            <template v-slot:prepend>
              <q-icon name="phone" color="grey-6" />
            </template>
          </q-input>
          <q-btn
            v-if="contactListApiSupported"
            color="primary"
            icon="contacts"
            flat
            round
            @click="selectFromPhoneContactList()"
          />
        </div>
      </div>

      <!-- Travelers -->
      <div class="section-card">
        <div class="section-header">
          <span class="section-icon">&#128100;</span>
          <span>Travelers</span>
        </div>
        <div class="section-body">
          <div class="travelers-scroll">
            <div
              v-for="(traveler, idx) in data.travelers"
              :key="idx"
              class="traveler-chip"
            >
              <div class="traveler-chip-header">
                <span class="traveler-label">Traveler {{ idx + 1 }}</span>
                <q-btn
                  v-if="idx !== 0"
                  icon="close"
                  flat
                  round
                  dense
                  size="xs"
                  color="negative"
                  @click="onRemoveTraveler(idx)"
                />
              </div>
              <q-input
                v-model="data.travelers[idx].name"
                label="Name"
                outlined
                dense
                class="q-mb-xs"
              />
              <q-select
                v-model="data.travelers[idx].type"
                :options="TRAVELER_TYPES"
                emit-value
                label="Type"
                outlined
                dense
              />
            </div>
            <q-btn
              icon="add"
              color="primary"
              round
              size="sm"
              class="add-traveler-btn"
              @click="onAddTraveler"
            />
          </div>
        </div>
      </div>

      <!-- Amadeus Code -->
      <div class="section-card">
        <div class="section-header">
          <span class="section-icon">&#9992;</span>
          <span>Amadeus Code</span>
        </div>
        <div class="section-body">
          <q-input
            v-model="data.smartAmadeusCode"
            outlined
            dense
            autogrow
            placeholder="Paste Amadeus PNR code here..."
            type="textarea"
            class="amadeus-input"
          />
          <q-input
            v-if="selectedLang === 'he'"
            v-model="ticketIssuanceDeadline"
            outlined
            dense
            label="מועד אחרון להנפקה (לדוגמה: יום א׳ 10 אוג׳ | 21:00)"
            class="q-mt-sm"
            dir="rtl"
          />
        </div>
      </div>

      <!-- Template Tabs -->
      <div class="section-card">
        <div class="section-header">
          <span class="section-icon">&#128196;</span>
          <span>Template</span>
        </div>
        <div class="section-body">
          <q-tabs
            v-model="selectedTemplateTab"
            inline-label
            dense
            no-caps
            class="template-tabs"
            active-color="primary"
            indicator-color="primary"
          >
            <q-tab name="All" label="All" />
            <q-tab name="Multi tickets" label="Multi tickets" />
            <q-tab name="Family fare" label="Family fare" />
            <q-tab name="Custom" label="My Template" icon="edit" />
          </q-tabs>
        </div>
      </div>

      <!-- Dynamic Form Sections -->
      <div
        v-for="(items, boxName) in formStructure"
        :key="boxName"
        class="section-card"
      >
        <div class="section-header">
          <span class="section-icon" v-if="boxName === 'prices'">&#128176;</span>
          <span class="section-icon" v-else>&#9881;</span>
          <span>{{ boxName }}</span>
        </div>
        <div class="section-body">
          <div
            v-for="(item, index) in items"
            :key="item"
            v-if="checkIfDisplay(boxName, item)"
            class="form-group"
            :class="{ 'form-group-first': index === 0 }"
          >
            <div class="form-group-label">{{ item }}</div>
            <div
              v-for="(option, optionName) in data[boxName][item]"
              :key="optionName"
            >
              <q-input
                v-if="
                  option.type === 'input' &&
                    !option.hide &&
                    checkIfDisplaySubInput(optionName)
                "
                v-model.number="option.value"
                type="number"
                outlined
                dense
                :label="option.label"
                class="form-field"
                :class="{ 'sub-field': option.subInput }"
              />
              <q-select
                v-else-if="
                  option.type === 'selectMultiple' &&
                    checkIfDisplaySubInput(optionName)
                "
                outlined
                dense
                :type="option.type"
                v-model="option.selected"
                multiple
                :options="option.options"
                :label="
                  option.nameLabel
                    ? `${optionName} Multiple selection`
                    : 'Multiple selection'
                "
                class="form-field"
                :class="{ 'sub-field': option.subInput }"
                emit-value
              />
              <q-select
                v-else-if="
                  option.type === 'select' && checkIfDisplaySubInput(optionName)
                "
                outlined
                dense
                :type="option.type"
                v-model="option.selected"
                :options="option.options"
                label="Select"
                class="form-field"
                :class="{ 'sub-field': option.subInput }"
                emit-value
              />
              <q-option-group
                v-else-if="
                  option.type === 'radio' || option.type === 'checkbox'
                "
                :options="option.options"
                :type="option.type"
                v-model="option.selected"
                class="form-field"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Language Selection -->
      <div class="section-card">
        <div class="section-header">
          <span class="section-icon">&#127760;</span>
          <span>Preview Language</span>
        </div>
        <div class="section-body">
          <q-btn-toggle
            v-model="selectedLang"
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            color="white"
            text-color="primary"
            :options="[
              { label: 'English', value: 'en' },
              { label: 'French', value: 'fr' },
              { label: 'Hebrew', value: 'he' }
            ]"
            class="lang-toggle"
          />
        </div>
      </div>
    </div>

    <!-- PREVIEW TAB -->
    <div v-else class="content-area">
      <div class="section-card preview-card">
        <div class="section-header">
          <span class="section-icon">&#128172;</span>
          <span>WhatsApp Message Preview</span>
        </div>
        <div class="section-body">
          <div class="preview-bubble" :class="{ 'rtl': selectedLang === 'he' }">
            <q-input
              :style="{ direction: selectedLang === 'he' ? 'rtl' : 'ltr' }"
              v-model="whatsappMessage"
              filled
              type="textarea"
              autogrow
              class="preview-textarea"
            />
          </div>
          <q-btn
            @click="onRedirectToWhatsapp"
            class="send-btn"
            unelevated
            no-caps
            color="positive"
            icon="send"
            label="Send to WhatsApp"
            size="md"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import {
  TRAVELER_TYPES,
  CLASSES_TYPE_MAP,
  LANGS,
  FORM_STRUCTURE,
  FORM_ITEMS,
  FAMILY_FARE,
  NO_SHOW_FEE,
  NO_SHOW_PLUS_CHANGE_FEE,
  CHANGE_FEE,
  ORDER
} from "src/assets/consts.js";

import messageMixin from "./messageMixin";
import { LocalStorage } from "quasar";
import { airports } from "src/assets/iata";
import { loadTemplate } from "src/assets/defaultTemplates.js";

export default {
  mixins: [messageMixin],
  data() {
    return {
      tab: "info",
      selectedTemplateTab: "All",
      contactListApiSupported: false,
      TRAVELER_TYPES: TRAVELER_TYPES,
      CLASSES_TYPE_MAP: CLASSES_TYPE_MAP,
      LANGS: LANGS,
      selectedLang: "en",
      formStructure: FORM_STRUCTURE,
      selectedBagges: [],
      data: {
        whatsappNumber: null,
        travelers: [{ name: "", type: "adult" }],
        smartAmadeusCode: "",
        journey: [],
        classOfTravel: "",
        firstDepart: null,
        ...FORM_ITEMS
      },
      previewTxt: "",
      whatsappMessage: "",
      darkMode: false,
      ticketIssuanceDeadline: ""
    };
  },
  created() {
    this.init();
    this.darkMode = LocalStorage.getItem("darkMode");
    this.$q.dark.set(this.darkMode);
  },
  methods: {
    onAddTraveler() {
      this.data.travelers.push({
        name: "",
        type: "adult"
      });
    },
    onRemoveTraveler(idx) {
      this.data.travelers = this.data.travelers.filter(
        (traveler, index) => index !== idx
      );
    },
    onPreview() {
      let flightsTxt, otherTravelers, heTicketSelected, heDeadline;

      this.data.journey = [];
      this.data.journeyCodes = {};
      this.data.classOfTravel = "";

      flightsTxt = this.getAmadeusTranslate(this.data.smartAmadeusCode);

      otherTravelers = this.data.travelers
        .filter((traveler, idx) => idx !== 0)
        .map(traveler => this.capitalizeFirstLetter(traveler.name))
        .join(", ");

      heTicketSelected = this.$t(this.data.prices["​ticket issuance"]["​ticket issuance"].selected);
      heDeadline = this.ticketIssuanceDeadline;

      switch (this.selectedTemplateTab) {
        case "All":
          if (this.selectedLang === "he") {
            this.whatsappMessage =
`*${this.capitalizeFirstLetter(this.data.travelers[0].name)}*, ${this.$t("shalom")}
⏰ *נא את אישורך להנפקת כרטיסך❗*
👈${heTicketSelected}${heDeadline ? '\n👈' + heDeadline : ''}

${this.getRelevantTxtStructure("opening")}

*מסלול הטיסות* 🌍
${flightsTxt}

*${this.$t("airline")} (XX) ✈️*
*xx*

*${this.$t("class of travel")} 💺*
*${this.$t(this.data.classOfTravel) || "XX"}*

*${this.$t("airfare")}*💳
${this.airfareTxt}

${this.$t("attention")}
* יש לאשר את הכרטוס היום עד השעה ${heDeadline || "XX"} ❗
${this.$t("price may change")}

${this.$t("baggage")}
${this.baggageList}

${this.$t("seat selection")}

⚠️ ${this.$t("restrictions")} ⚠️
${this.$t("change")} ${this.changeFeeValue}
${this.$t("cancel")} ${this.data.prices["cancel fee"].cancelFee.value}${this.selectedCurrency}
${this.$t("no show")} ${this.noShowValue}

*${this.$t("ticket issuance")}*⌛
⏰*${heTicketSelected}*‼️${heDeadline ? '\n👈*' + heDeadline + '*' : ''}

${this.$t("please pay again msg")}

${this.$t("farewell")}`;
          } else {
            this.whatsappMessage = `*${this.capitalizeFirstLetter(
              this.data.travelers[0].name
            )}*, ${this.$t("shalom")}\n\n${this.getRelevantTxtStructure(
              "opening"
            )}\n\n*${this.$t("itinerary")}* ${
              this.data.details.itinerary.itinerary.selected
            } \n${flightsTxt} ${this.ticketingOptionsTxt}
*${this.$t("airline")}* (XX) ✈️\n  *xx*, *xx* & *xx*\n
*${this.$t("class of travel")} 💺*\n  ${this.$t("compartment options")} \n
*${this.$t("airfare")} 💲* \n${this.airfareTxt}\n\n${this.$t("baggage")} 🧳 ${
              this.baggageList
            } \n\n${this.$t("seat selection")}\n${this.mealTxt}\n${this.$t(
              "attention"
            )}\n${this.$t("price may change")} \n
⚠️${this.$t("restrictions")}⚠️ \n${this.$t("change")} ${
              this.changeFeeValue
            } ${this.$t("p. p.")}\n${this.$t("cancel")} ${
              this.data.prices["cancel fee"].cancelFee.value
            }${this.selectedCurrency} ${this.$t("p. p.")} \n${this.$t(
              "no show"
            )} ${this.noShowValue} ${this.$t("p. p.")} \n*${this.$t(
              "ticket issuance"
            )}:*\n      *${this.$t(
              this.data.prices["​ticket issuance"]["​ticket issuance"].selected
            )}*\n${this.$t("p. p. = per person")} \n\n${this.$t(
              "please pay again msg"
            )} \n\n${this.$t("farewell")}`;
          }
          break;

        case "Multi tickets":
          this.whatsappMessage = `*${this.capitalizeFirstLetter(
            this.data.travelers[0].name
          )}*, ${this.$t("shalom")}
        \n${this.getRelevantTxtStructure("opening")}\n\n${this.$t(
            "ticket explanation"
          )} \n\n*${this.$t("itinerary")}* ${
            this.data.details.itinerary.itinerary.selected
          } \n${flightsTxt}\n*${this.$t("trip total cost")}:*\n${this.$t(
            "price calc demo"
          )}\n\n${this.priceExplanationTxt}\n\n${
            this.ticketingOptionsTxt
          }${this.$t("please pay again msg")} \n\n${this.$t("farewell")}`;
          break;

        case "Family fare":
          this.whatsappMessage = `*${this.capitalizeFirstLetter(
            this.data.travelers[0].name
          )}*, ${this.$t("shalom")}
        \n${this.getRelevantTxtStructure("opening")}\n\n*${this.$t(
            "itinerary"
          )}* ${
            this.data.details.itinerary.itinerary.selected
          } \n${flightsTxt} \n${this.$t(
            "airline"
          )}* (XX) ✈️\n  *xx*, *xx* & *xx*\n
*${this.$t("class of travel")} 💺*\n  ${this.$t(
            "compartment options"
          )} \n\n*${this.$t("airfare")} 💲* \n${this.airfareTxt}\n${this.$t(
            "please pay again msg"
          )} \n\n${this.$t("farewell")}`;
          break;

        case "Custom":
          this.whatsappMessage = this.buildFromCustomTemplate(flightsTxt);
          break;

        default:
          break;
      }
      if (this.data.travelers.length === 1) {
        this.whatsappMessage = this.whatsappMessage.replaceAll(
          `\n${this.$t("p. p. = per person")}`,
          ""
        );
        this.whatsappMessage = this.whatsappMessage.replaceAll(
          this.$t("p. p."),
          ""
        );
      }
      if (this.$i18n.locale === "he") {
        this.whatsappMessage = this.whatsappMessage.replaceAll(
          `\n${this.$t("p. p. = per person")}`,
          ""
        );
      }
    },
    buildFromCustomTemplate(flightsTxt) {
      const langKey = this.selectedLang;
      const tpl = loadTemplate("flight", langKey);
      if (!tpl) return "";

      const customerName = this.capitalizeFirstLetter(
        this.data.travelers[0].name || ""
      );
      const allNames =
        this.data.travelers.length > 1 && this.allNamesTxt
          ? this.allNamesTxt
          : "";
      const cancelFee = this.data.prices["cancel fee"].cancelFee.value;
      const ticketIssuance = this.$t(
        this.data.prices["​ticket issuance"]["​ticket issuance"].selected
      );
      const classTxt = this.$t(this.data.classOfTravel) || "XX";

      const values = {
        CUSTOMER_NAME: customerName,
        ALL_NAMES: allNames,
        GREETING: this.$t("shalom"),
        DESTINATION: this.journeyTxt,
        FLIGHTS: flightsTxt,
        AIRLINE_NAME: "xx",
        AIRLINE_CODE: "XX",
        CLASS: classTxt,
        PRICE: this.airfareTxt,
        CURRENCY: this.selectedCurrency,
        BAGGAGE: this.baggageList,
        CHANGE_FEE: this.changeFeeValue,
        CANCEL_FEE: cancelFee,
        NO_SHOW: this.noShowValue,
        TICKET_ISSUANCE: ticketIssuance,
        FAREWELL: this.$t("farewell")
      };

      return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) =>
        values[key] !== undefined ? values[key] : m
      );
    },
    getRelevantTxtStructure(part, first, second) {
      if (this.selectedLang === "en") {
        switch (part) {
          case "opening":
            return `${this.$t("flight desc")} ${this.allNamesTxt}\n*${
              this.journeyTxt
            }*\n\n${this.$t("please pay msg")} `;

          default:
            return part;
        }
      } else if (this.selectedLang === "fr") {
        switch (part) {
          case "opening":
            return `${this.$t("flight desc")} *${this.journeyTxt}*${
              this.allNamesTxt ? `\n${this.allNamesTxt}` : ""
            }\n\n${this.$t("please pay msg")} `;

          default:
            return part;
        }
      } else if (this.selectedLang === "he") {
        switch (part) {
          case "opening":
            return `${this.$t("flight desc")} *(👤${this.capitalizeFirstLetter(this.data.travelers[0].name)})* הקרובה ל*${this.journeyTxt}*${
              this.data.travelers.length > 1 ? `\nעם ${this.allNamesTxt}` : ""
            }\n\n${this.$t("please pay msg")}`;
          case "priceDetails":
            return `${this.data.prices.price[first].value}${
              this.selectedCurrency
            } * ${this.travelersTypeAmountMap[first]} ${this.$t(first)}\n`;

          default:
            return part;
        }
      }
    },
    getAmountOfSpecificTraveler(travelerType) {
      return this.data.travelers.filter(tr => tr.type === travelerType).length;
    },
    checkIfDisplay(boxName, item) {
      const tempalteToShow = this.data[boxName][item].templatesToBeDisplayIn;
      if (this.selectedTemplateTab === "All") return true;
      if (!tempalteToShow) return true;
      return tempalteToShow.includes(this.selectedTemplateTab);
    },
    checkIfDisplaySubInput(optionName) {
      switch (optionName) {
        case FAMILY_FARE:
          return this.data.details.airfare.airfare.selected === FAMILY_FARE;
        // * no show
        case NO_SHOW_FEE:
          return (
            this.data.prices["no show"]["no show"].selected === NO_SHOW_FEE ||
            this.data.prices["no show"]["no show"].selected ===
              NO_SHOW_PLUS_CHANGE_FEE
          );
          break;
        case NO_SHOW_PLUS_CHANGE_FEE:
          return (
            this.data.prices["no show"]["no show"].selected ===
            NO_SHOW_PLUS_CHANGE_FEE
          );
          break;
        // * change fee
        case CHANGE_FEE:
          return (
            this.data.prices["Change fees"]["Change fees"].selected ===
              "(+difference in fare)" ||
            this.data.prices["Change fees"]["Change fees"].selected ===
              "Only permitted upon availability on Bonus Quota!"
          );
          break;

        default:
          return true;
      }
    }
  },
  computed: {
    selectedCurrency() {
      return this.data.prices.currency.currency.selected;
    },
    travelersTypeAmountMap() {
      let travelersTypeAmountMap = {};
      this.data.travelers.forEach(traveler => {
        if (travelersTypeAmountMap[traveler.type])
          ++travelersTypeAmountMap[traveler.type];
        else travelersTypeAmountMap[traveler.type] = 1;
      });
      return travelersTypeAmountMap;
    },
    totalPrice() {
      let total = 0;
      for (const key in this.travelersTypeAmountMap) {
        total +=
          this.travelersTypeAmountMap[key] * this.data.prices.price[key].value;
      }
      return total;
    },
    noShowValue() {
      const noShowSelection = this.data.prices["no show"]["no show"].selected;
      switch (noShowSelection) {
        case "total loss":
          return this.$t("total loss");
        case NO_SHOW_FEE:
          return this.data.prices["no show"][NO_SHOW_FEE].value;
        case NO_SHOW_PLUS_CHANGE_FEE:
          const noShowFee = this.data.prices["no show"][NO_SHOW_FEE].value;
          const changeFee = this.data.prices["no show"][NO_SHOW_PLUS_CHANGE_FEE]
            .value;
          return `${noShowFee}${this.selectedCurrency} + ${this.$t(
            "change fee"
          )}: ${changeFee}${this.selectedCurrency}`;

        default:
          return `0${this.selectedCurrency}`;
          break;
      }
    },
    changeFeeValue() {
      const changeFeeSelection = this.data.prices["Change fees"]["Change fees"]
        .selected;
      const changeFeeValue = this.data.prices["Change fees"][CHANGE_FEE].value;
      switch (changeFeeSelection) {
        case "Non Changeable":
          return this.$t("Non Changeable");
        case "Non Refundable":
          return this.$t("Non Refundable");
        case "(+difference in fare)":
          return `${changeFeeValue}${this.selectedCurrency}\n       ${this.$t(
            "(+difference in fare)"
          )}`;
        case "Only permitted upon availability on Bonus Quota!":
          return `${changeFeeValue}${this.selectedCurrency}\n       ${this.$t(
            "Only permitted upon availability on Bonus Quota!"
          )}`;

        default:
          return `0${this.selectedCurrency}`;
          break;
      }
    },
    baggageList() {
      var sep = this.$i18n.locale === "he" ? "\n" : "\n ";
      var prefix = this.$i18n.locale === "he" ? "\n✅ " : "\n ";
      return (
        prefix +
        this.data.details.baggage.baggage.selected
          .map(baggage => this.$t(baggage))
          .join(this.$i18n.locale === "he" ? "\n✅ " : ",\n ")
      );
    },
    priceDetails() {
      let priceTxt = ``;
      for (const key in this.travelersTypeAmountMap) {
        if (this.$i18n.locale === "he") {
          var count = this.travelersTypeAmountMap[key];
          priceTxt += `👈 *${this.data.prices.price[key].value}${this.selectedCurrency} ${this.$t(key)}${count > 1 ? ' x' + count : ''}*\n`;
        } else {
          priceTxt += `  ${this.travelersTypeAmountMap[key]} ${this.$t(
            key
          )} * ${this.data.prices.price[key].value}${this.selectedCurrency} \n`;
        }
      }
      priceTxt += `\n*${this.$t("total")}* ${this.totalPrice}${
        this.selectedCurrency
      }`;
      return priceTxt;
    },
    mealTxt() {
      const selectedMeals = this.data.details.food.food.selected;
      if (!selectedMeals.length) return "";
      else
        return `\n✅${this.$t("meal")} 🍴 ${selectedMeals.map(
          meal => `\n${this.$t(meal)}`
        )}\n`;
    },
    allNamesTxt() {
      // your upcoming flight
      let txt = "";
      if (this.$i18n.locale === "en") {
        txt = `${this.$t("your")}`;
        if (this.data.travelers.length === 1) txt += "s ";
        else {
          this.data.travelers.forEach((traveler, idx) => {
            if (idx === 0) return;
            // * first traveler is the the "your" above
            txt += " & " + this.capitalizeFirstLetter(traveler.name);
          });
          txt = `*${txt}\'s* `;
        }
        return txt + this.$t("upcoming trip to");
      } else if (this.$i18n.locale === "fr") {
        this.data.travelers.forEach((traveler, idx) => {
          if (idx === 0) return;
          if (idx === 1) {
            txt += `accompagné de *${this.capitalizeFirstLetter(
              traveler.name
            )}*`;
          } else {
            // * & will added form the second and so
            txt += " *& " + this.capitalizeFirstLetter(traveler.name) + "*";
          }
        });
        return txt;
      } else if (this.$i18n.locale === "he") {
        this.data.travelers.forEach((traveler, idx) => {
          if (idx === 0) return;
          // * first traveler is the the "your" above
          txt += `${this.capitalizeFirstLetter(traveler.name)}${
            idx < this.data.travelers.length - 1 ? " & " : ""
          }`;
        });
        txt = `*${txt}* `;
        return txt;
      }
    },
    journeyTxt() {
      let txt = "";
      let uniqeDestinations;
      uniqeDestinations = this.data.journey.filter(
        (item, idx, array) =>
          this.firstDepart !== item && array.indexOf(item) === idx
      );

      uniqeDestinations.forEach((place, idx) => {
        var name = place;
        if (this.$i18n.locale === "he" && this.data.journeyCodes && this.data.journeyCodes[place]) {
          var code = this.data.journeyCodes[place];
          if (airports[code] && airports[code].CityNameHe) {
            name = airports[code].CityNameHe;
          }
        } else {
          name = this.$t(place);
        }
        txt += `${name}${
          idx < uniqeDestinations.length - 1 ? ", " : ""
        }`;
      });
      return txt;
    },
    airfareTxt() {
      if (this.data.details.airfare.airfare.selected === "Family fare") {
        let introFamilyFareTxt = `${this.$t(FAMILY_FARE)}`,
          optionsFamilyFareTxt = ``,
          fareDetailsTxt = ``;
        this.data.details.airfare[FAMILY_FARE].selected.forEach(
          (option, idx) => {
            optionsFamilyFareTxt += `${idx + 1}. ${this.$t(
              `option-${option}`
            )}`;
            fareDetailsTxt += `\n${this.$t(option)}\n`;
          }
        );
        if (this.$i18n.locale === "he") {
          return introFamilyFareTxt + fareDetailsTxt;
        } else {
          return (
            introFamilyFareTxt +
            optionsFamilyFareTxt +
            fareDetailsTxt +
            `\n${this.$t("attention")} \n${this.$t(
              "price may change"
            )} \n\n⚠️${this.$t("restrictions")}⚠️\n${this.$t("change")} ${
              this.changeFeeValue
            } ${this.$t("p. p.")} \n${this.$t("cancel")} ${
              this.data.prices["cancel fee"].cancelFee.value
            }${this.selectedCurrency} ${this.$t("p. p.")} \n${this.$t(
              "no show"
            )} ${this.noShowValue} ${this.$t("p. p.")} \n*${this.$t(
              "ticket issuance"
            )}:*\n      *${this.$t(
              this.data.prices["​ticket issuance"]["​ticket issuance"].selected
            )}* \n${this.$t("p. p. = per person")}`
          );
        }
      } else {
        return this.priceDetails;
      }
    },
    priceExplanationTxt() {
      return `${this.$t("trip explanation 1")} ${
        this.data.prices["multi tickets"].numOfTicketOptions.value
      } ${this.$t("trip explanation 2")}`;
    },
    ticketingOptionsTxt() {
      let txt = "";
      const numOfTicketingOptions = this.data.prices["multi tickets"]
        .numOfTicketOptions.value;
      for (let num = 0; num < numOfTicketingOptions; num++) {
        if (this.$i18n.locale === "he") {
          // ! check why not showen order
          txt += `*כרטיס ${this.$t(ORDER[num])}*: ${this.$t(
            "ticket option details"
          )}\n`;
        } else {
          txt += `*${this.$t(ORDER[num])} ${this.$t(
            "ticket option details"
          )} \n`;
        }
      }
      return txt;
    }
  },
  watch: {
    selectedLang: {
      handler(lang) {
        this.$i18n.locale = lang;
        if (this.tab === 'preview') {
          this.onPreview();
        }
      },
      immediate: true
    },
    tab(newTab) {
      if (newTab === 'preview') {
        this.onPreview();
      }
    },
    "data.travelers": {
      handler(travelers) {
        for (const key in this.data.prices.price) {
          if (travelers.filter(traveler => traveler.type === key).length) {
            this.data.prices.price[key].hide = false;
          } else this.data.prices.price[key].hide = true;
        }
      },
      deep: true,
      immediate: true
    },
    selectedTemplateTab(tab) {
      if (tab === "Family fare") {
        this.data.details.airfare.airfare.selected = "Family fare";
      } else this.data.details.airfare.airfare.selected = "";
      if (tab === "Multi tickets") {
        this.data.prices["multi tickets"].numOfTicketOptions.value = 1;
      } else this.data.prices["multi tickets"].numOfTicketOptions.value = 0;
    },
    darkMode: {
      handler(state) {
        this.$q.dark.set(state);
        LocalStorage.set("darkMode", state);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.page-wrapper {
  padding-top: 100px;
  padding-bottom: 32px;
  min-height: 100vh;
  background: #f5f7fa;
}

body.body--dark .page-wrapper {
  background: #121212;
}

/* Header */
.modern-header {
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.toolbar-main {
  padding: 4px 16px;
  min-height: 48px;
}

.app-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.title-icon {
  margin-right: 8px;
  font-size: 20px;
}

.header-tabs {
  background: rgba(255, 255, 255, 0.1);
}

/* Content */
.content-area {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

/* Section Cards */
.section-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

body.body--dark .section-card {
  background: #1e1e1e;
}

.section-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #1a73e8;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: capitalize;
}

body.body--dark .section-header {
  border-bottom-color: #333;
  color: #8ab4f8;
}

.section-icon {
  font-size: 18px;
}

.section-body {
  padding: 16px;
}

/* Row flex for contact */
.row-flex {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flex-grow {
  flex: 1;
}

/* Travelers */
.travelers-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  align-items: flex-start;
}

.traveler-chip {
  min-width: 170px;
  max-width: 200px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px;
  flex-shrink: 0;
}

body.body--dark .traveler-chip {
  background: #2a2a2a;
}

.traveler-chip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.traveler-label {
  font-weight: 600;
  font-size: 13px;
  color: #555;
}

body.body--dark .traveler-label {
  color: #bbb;
}

.add-traveler-btn {
  flex-shrink: 0;
  margin-top: 24px;
}

/* Amadeus */
.amadeus-input {
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
}

/* Template tabs */
.template-tabs {
  background: #f8f9fa;
  border-radius: 8px;
}

body.body--dark .template-tabs {
  background: #2a2a2a;
}

/* Form groups */
.form-group {
  margin-top: 16px;
  &.form-group-first {
    margin-top: 0;
  }
}

.form-group-label {
  font-weight: 600;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  text-transform: capitalize;
}

body.body--dark .form-group-label {
  color: #aaa;
}

.form-field {
  max-width: 100%;
  margin-top: 6px;
}

.sub-field {
  margin-left: 16px;
}

/* Language toggle */
.lang-toggle {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

body.body--dark .lang-toggle {
  border-color: #444;
}

/* Preview */
.preview-card {
  min-height: 300px;
}

.preview-bubble {
  background: #e7ffdb;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  position: relative;

  &.rtl {
    direction: rtl;
  }
}

body.body--dark .preview-bubble {
  background: #1a3a2a;
}

.preview-textarea {
  font-size: 13px;
  line-height: 1.5;
}

.preview-textarea ::v-deep .q-field__control {
  background: transparent !important;
}

.preview-textarea ::v-deep .q-field__native {
  color: #111;
}

body.body--dark .preview-textarea ::v-deep .q-field__native {
  color: #e0e0e0;
}

.send-btn {
  width: 100%;
  border-radius: 10px;
  padding: 12px;
  font-weight: 600;
}

/* Dark mode heading fix */
body.body--dark {
  h1, h2, h3, h4, h5, h6 {
    color: white;
  }
}
</style>
