function isMobileScreen() {
    if (!Modernizr.mq("only screen")) {
        return false;
    }
    var windowWidth = window.innerWidth;
    var isLandscapeMatch = Modernizr.mq("only screen and (min-device-width: 768px) and (orientation: landscape)") && windowWidth >= 768;
    var isPortraitMatch = Modernizr.mq("only screen and (min-device-width: 600px) and (orientation: portrait)") && windowWidth >= 600;
    return !isLandscapeMatch && !isPortraitMatch;
}
function isMobileDevice() {
    return device.mobile() && isMobileScreen();
}

if (isMobileDevice()) {
    $("meta[name='viewport']").attr("content", "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=yes");
    React.initializeTouchEvents(true);
}
else {
    $("meta[name='viewport']").attr("content", "width=1024, user-scalable=yes");
}

$("html").addClass("loading");

$(function () {
    $("html").removeClass("loading");
    var isDev = $("html").is(".dev-environment");

    if (isDev) {
        $("body").on("click", "a", function (event) {
            var href = event.target.href.replace(location.origin, "");
            if (!event.isDefaultPrevented() && href.lastIndexOf("/") === 0) {
                event.preventDefault();
                location.href = href.substr(1) || "main";
            }
        });
    }
});

function chooseRussianCaseByInt(num, word1, word234, word5) {
    if (typeof num != 'number')
        return word5;

    var decimalDigit = Math.floor(num / 10) % 10;
    var lastDigit = num % 10;

    if (decimalDigit != 1) {
        if (lastDigit == 1) {
            return word1;
        }
        if (lastDigit >= 2 && lastDigit <= 4) {
            return word234;
        }
    }

    return word5;
}

function generateFindOfficesLink(paramsObj) {
    return "offices?" + $.param(paramsObj);
}

function generateCourierLink(paramsObj) {
    return "courier?" + $.param(paramsObj);
}

function chooseRussianCaseByIntWithFromPreposition(num, word1, word2) {
    if (typeof num != 'number')
        return word2;

    return num == 1 ? word1 : word2;
}

function transliterate(text, engToRus) {
    var rus = "щ   ш  ч  ц  ю  я  ё  ж  ъ  ы  э  а б в г д е з и й к л м н о п р с т у ф х ь".split(/ +/g),
        eng = "shh sh ch cz yu ya yo zh `` y' e` a b v g d e z i j k l m n o p r s t u f x `".split(/ +/g);

    var changeList = [
        ['a', 'à', 'á', 'â', 'ä', 'æ', 'ã', 'å', 'ā'],
        ['c', 'ç', 'ć', 'č'],
        ['e', 'è', 'é', 'ê', 'ë', 'ē', 'ė', 'ę'],
        ['i', 'ï', 'ï', 'í', 'ī', 'į', 'î'],
        ['l', 'ł'],
        ['n', 'ñ', 'ń'],
        ['o', 'ô', 'ö', 'ò', 'ó', 'œ', 'ø', 'ō', 'õ' ],
        ['s', 'ß', 'ś', 'š' ],
        ['u', 'û', 'ü', 'ù', 'ú', 'ū'],
        ['y', 'ÿ'],
        ['z', 'ž', 'ź', 'ż']
    ];

    text = text.toLowerCase();
    if (engToRus) {
        $.each(changeList, function (ind, val) {
            var symbol = val[0];
            text = text.replace(new RegExp(val.slice(1).join("|"), 'g'), symbol);
        });
    }

    for (var i = 0; i < rus.length; i++) {
        text = text.split(engToRus ? eng[i] : rus[i]).join(engToRus ? rus[i] : eng[i]);
    }

    return text;
}
function transliterationFilter(value) {
    // in future we should get language from the portlet model
    var locale = "ru_RU";
    var russianLocale = "ru_RU";
    var isRussianValue = value.match(/^[а-яА-Я\-]*$/);

    if (locale != russianLocale && isRussianValue) {
        value = transliterate(value);
    } else if (locale == russianLocale && !isRussianValue) {
        value = transliterate(value, true);
    }

    return value;
}
function sourceValueFormatter(value) {
    var suggestPrefix = {
        "ru_RU": "Россия город ",
        "en_EN": "Russian Federation город "
    };
    value = transliterationFilter(value);
    // in future we should get language from the portlet model
    return suggestPrefix["ru_RU"] ? suggestPrefix["ru_RU"] + value : value;
}
function destinationValueFormatter(value) {
    var suggestPrefix = {
        "ru_RU": "город "
    };
    value = transliterationFilter(value);
    // in future we should get language from the portlet model
    return suggestPrefix["ru_RU"] + value;
}

function getCountryName(yandexString) {
    var tokens = yandexString.split(', ');
    return tokens[tokens.length - 1];
}

function getCountryId(countryName, callback) {
    $.ajax({
        url: "/calculator/nsi/v1/countries/by.name/" + encodeURIComponent(countryName),
        type: "GET",
        headers: {
            'Accept': 'application/json'
        },
        success: function (data) {
            callback(data.code);
        },
        error: function () {
            callback(0);
        }
    });
}

function handleCitiesInput(state, me) {
    var newState = {};
    _.extend(newState, state);

    if (newState.source) {
        newState.sourceTown = getTownName(newState.source.name);
    }
    if (newState.destination) {
        newState.destinationTown = getTownName(newState.destination.name);
        newState.isInternational = newState.sourceCountryName != (newState.destinationCountryName.country_IP ? newState.destinationCountryName.country_IP : newState.destinationCountryName);
    }
    else {
        newState.destinationTown = "";
        newState.isInternational = false;
        newState.loading = false;
    }
    if (newState.isInternational) {
        newState.registered = false;
        newState.smsNotification = false;
    }
    else {
        newState.registeredInternational = false;
    }
    if (newState.isInternational) {
        if (!newState.registeredInternational) {
            newState.deliveryNotification = false;
        }
    }
    if (!newState.isInternational && newState.destination && newState.source) {
        newState.rapid = false;
    }
    if (!newState.registered && !newState.registeredInternational) {
        newState.smsNotification = false;
        newState.deliveryNotification = false;
    }


    var mailingStruct = {
        postingType: 'VPO',
        postingKind: 'POST_CARD',
        postingCategory: 'SIMPLE',
        weight: 20,
        notificationOfDeliveryRpo: newState.deliveryNotification
    };

    if (newState.registered || newState.registeredInternational) {
        mailingStruct.postingCategory = "ORDERED";
        mailingStruct.notificationOfDeliveryRpo = newState.deliveryNotification;
        mailingStruct.smsNotification = newState.smsNotification;
    }
    if (newState.isInternational) {
        mailingStruct.postingType = "MPO";
        mailingStruct.countryTo = newState.destinationCountryName.code ? state.destinationCountryName.code : "";

        if (newState.rapid) {
            mailingStruct.wayForward = "AVIA";
        }
        else {
            mailingStruct.wayForward = "EARTH";
        }
    }

    if (newState.sourceGeoObj && newState.destinationGeoObj) {
        var calculationEntity = {
            origin: state.sourceGeoObj,
            destination: state.destinationGeoObj,
            sendingType: "LETTER_PARCEL"
        };
        var productPageStateParams = me.getProductPageStateParams(newState);
        calculateCostTime(calculationEntity, mailingStruct, null, productPageStateParams,
            function (data) {
                newState.cost = data.costEntity != null ? data.costEntity.cost : 0,

                    newState.loading = false,
                    newState.term = data.timeEntity.deliveryTime,
                    newState.timePeriods = data.timeEntity,
                    newState.emsTerm = postProcessEmsTerm(data.timeEntity.emsDeliveryTimeRange),
                    newState.firstClassTerm = data.timeEntity.firstClassTime,
                    newState.isAviaAvailable = data.costEntity != null ? data.costEntity.aviaAvailable : true,
                    newState.isGroundAvailable = data.timeEntity != null ? data.timeEntity.groundAvailable : true;
                me.setState(newState);

            });
    }
    else {
        newState.loading = false;
        me.setState(newState);
    }
}

function handleLettersCityInput(state, me, loadMinCost, updateOptions) {
    var newState = {};
    _.extend(newState, state);

    if (newState.source) {
        newState.sourceTown = getTownName(newState.source.name);
    }

    if (newState.destination) {
        newState.destinationTown = getTownName(newState.destination.name);
        newState.international = newState.sourceCountryName != (newState.destinationCountryName.country_IP ? newState.destinationCountryName.country_IP : newState.destinationCountryName);
    }
    else {
        newState.destinationTown = "";
        newState.international = false;
        newState.loading = false;
    }

    var isSimple = !newState.insurance && !newState.registered;
    //determine kind
    var sum = newState.insuranceSum != null ? newState.insuranceSum : 0;
    var cashSum = newState.cashOnDeliverySum != null ? newState.cashOnDeliverySum : 0;
    var insuranceSum = Math.max(sum, cashSum);
    var standardKind, firstClassKind;
    var emsKind = "EMS";

    //mpo kinds
    if (newState.international) {
        standardKind = newState.registeredInternational ? "LETTER" : "GROUND_LETTER";
        firstClassKind = "LETTER";//avia
    } else {
        //vpo kinds
        if (insuranceSum > 50000) {
            emsKind = "NONE"
        }
        if (newState.size.weight <= 100) {
            standardKind = "LETTER";
            if (insuranceSum <= 20000) {
                firstClassKind = "FIRST_CLASS_LETTER";
            } else {
                firstClassKind = "NONE";
            }

        } else if (newState.size.weight == 500) {
            if (insuranceSum <= 10000) {
                standardKind = "GROUND_BANDEROLE";
            } else if (insuranceSum > 10000 && insuranceSum < 20000) {
                standardKind = "NONE";
            }
            if (insuranceSum <= 20000) {
                firstClassKind = "FIRST_CLASS_LETTER";
            } else if (insuranceSum > 20000) {
                firstClassKind = "NONE";
                standardKind = "PARCEL";
            }
        } else if (newState.size.weight == 2000) {
            firstClassKind = "FIRST_CLASS_BANDEROLE";
            if (insuranceSum <= 10000) {
                standardKind = "GROUND_BANDEROLE";
//                firstClassKind = "BANDEROLE"; //AVIA
            } else if (insuranceSum > 10000 && insuranceSum <= 20000) {
                standardKind = "NONE";
            }
            if (insuranceSum > 10000 && insuranceSum <= 20000) {
                firstClassKind = "FIRST_CLASS_BANDEROLE";
            }
            else if (insuranceSum > 20000) {
                standardKind = "PARCEL";
                firstClassKind = "NONE";
            }
        }
    }
    newState.kind.firstClassKind = firstClassKind;
    newState.kind.standardKind = standardKind;
    newState.kind.emsKind = emsKind;

    newState.hasFirstClass = newState.hasFirstClass && firstClassKind != "NONE";
    newState.hasStandard = newState.hasStandard && standardKind != "NONE";
    newState.hasEms = newState.hasEms && emsKind != "NONE";


    if (newState.ems && newState.hasEms) {
        newState.activeKind = emsKind;
    } else if (newState.firstClass && newState.hasFirstClass) {
        newState.activeKind = firstClassKind;
    } else {
        if ((newState.insuranceSum>20000 || newState.cashOnDeliverySum > 20000) && newState.firstClass && newState.hasEms) {
            newState.activeKind = emsKind;
            _.extend(newState, me.changeDeliveryType("ems"));
        } else  if (newState.hasStandard) {
            newState.activeKind = standardKind;
            _.extend(newState, me.changeDeliveryType("standard"));
        } else if (newState.hasFirstClass) {
            newState.activeKind = firstClassKind;
            _.extend(newState, me.changeDeliveryType("firstClass"));
        } else if (newState.hasEms) {
            newState.activeKind = emsKind;
            _.extend(newState, me.changeDeliveryType("ems"));
        }
    }
    _.extend(newState, me.validateSum(newState));

    //kind is defined
    mailingStruct = {
        postingType: 'VPO',
        postingCategory: 'SIMPLE',
        weight: newState.size.weight,
        notificationOfDeliveryRpo: false,
        inventory: newState.inventory && !newState.international,
        carefullyMark: newState.careful,
        zipCodeFrom: newState.sourceIndex,
        zipCodeTo: newState.destinationIndex,
        postalCodesFrom: newState.sourceIndexes,
        postalCodesTo: newState.destinationIndexes
    };
    //kind post processing
    mailingStruct.postingKind = newState.activeKind;
    if (newState.firstClass) {
        if (newState.activeKind == "FIRST_CLASS_BANDEROLE") {
            if (!(newState.insurance && newState.insuranceSum)) {
                mailingStruct.postingCategory = "ORDERED";
            }
        }
    } else if (newState.ems) {
        if (!(newState.insurance && newState.insuranceSum)) {
            mailingStruct.postingCategory = "ORDINARY";
            mailingStruct.zipCodeFrom = newState.sourceIndex;
            mailingStruct.zipCodeTo = newState.destinationIndex;
        }
        if (newState.international) {
            mailingStruct.postingCategory = "WITH_DOCUMENTS";
        }
    } else if (newState.activeKind === "PARCEL") {
        if (!(newState.insurance && newState.insuranceSum)) {
            mailingStruct.postingCategory = "ORDINARY";
            mailingStruct.zipCodeFrom = newState.sourceIndex;
            mailingStruct.zipCodeTo = newState.destinationIndex;
            mailingStruct.wayForward = "EARTH";
        }
    } else {
        if (newState.activeKind === "GROUND_BANDEROLE") {
            mailingStruct.postingKind = "BANDEROLE";
            mailingStruct.wayForward = "EARTH";
        }
        if (newState.activeKind === "GROUND_LETTER") {
            mailingStruct.postingKind = "LETTER";
            mailingStruct.wayForward = "EARTH";
        }
    }

    if ((newState.registered || newState.registeredInternational || newState.deliveryNotification) && !newState.ems) {
        mailingStruct.postingCategory = "ORDERED";
    }
    if (((newState.insurance && newState.insuranceSum) || (newState.cashOnDelivery && newState.cashOnDeliverySum) || newState.inventory) && !(newState.international && newState.activeKind == "EMS")) {
        mailingStruct.postingCategory = "WITH_DECLARED_VALUE";
        mailingStruct.declaredValue = insuranceSum > 0 ? insuranceSum : 1; //if inventory then it should be 1 rub
    }
    if (newState.deliveryNotification) {
        mailingStruct.notificationOfDeliveryRpo = true;
    }

    if (newState.international) {
        mailingStruct.postingType = "MPO";
        mailingStruct.countryTo = newState.destinationCountryName.code ? state.destinationCountryName.code : "";
        mailingStruct.zipCodeTo = "";
    }
    if (!newState.international && !isSimple || newState.firstClass || newState.ems || newState.activeKind == "BANDEROLE" || newState.activeKind == "GROUND_BANDEROLE") {
        mailingStruct.zipCodeFrom = newState.sourceIndex;
        mailingStruct.zipCodeTo = newState.destinationIndex;
    }
    var minCostParams;
    if (loadMinCost) {
        if (newState.international) {
            minCostParams = $.extend(true, {}, productCalculatorDefaultParams.internationalLetters);
        } else {
            minCostParams = $.extend(true, {}, productCalculatorDefaultParams.letters);
            minCostParams.standard.postingKind = newState.kind.standardKind;
            minCostParams.firstClass.postingKind = newState.kind.firstClassKind;
        }
        var minCommonParams = _.omit(mailingStruct, "postingKind", "postingCategory", "notificationOfDeliveryRpo", "inventory", "carefullyMark", "wayForward");

        minCostParams.standard = $.extend(true, minCostParams.standard, minCommonParams);
        minCostParams.firstClass = $.extend(true, minCostParams.firstClass, minCommonParams);
        minCostParams.ems = $.extend(true, minCostParams.ems, minCommonParams);

        if (newState.kind.standardKind === "GROUND_BANDEROLE") {
            minCostParams.standard.postingKind = "BANDEROLE";
            minCostParams.standard.wayForward = "EARTH";
        } else if (newState.kind.standardKind === "GROUND_LETTER" || newState.kind.standardKind === "NONE") {
            minCostParams.standard.postingKind = "LETTER";
            minCostParams.standard.wayForward = "EARTH";
        }
        if (newState.kind.firstClassKind === "NONE") {
            minCostParams.firstClass.postingKind = "FIRST_CLASS_LETTER"
        }
        if (minCostParams.firstClass.postingKind === "FIRST_CLASS_BANDEROLE") {
            minCostParams.firstClass.postingCategory = "ORDERED";
        }
    }

    if (newState.sourceGeoObj && newState.destinationGeoObj) {
        var calculationEntity = {
            origin: state.sourceGeoObj,
            destination: state.destinationGeoObj,
            sendingType: "LETTER_PARCEL"
        };
        var productPageStateParams = me.getProductPageStateParams(newState);
        calculateCostTime(calculationEntity, mailingStruct, minCostParams, productPageStateParams,
            function (data) {
                newState.term.standardTerm = data.timeEntity.deliveryTime;
                newState.term.emsTerm = postProcessEmsTerm(data.timeEntity.emsDeliveryTimeRange);
                newState.term.firstClassTerm = data.timeEntity.firstClassTime;

                newState.cost = data.costEntity != null ? data.costEntity.cost : 0;
                if (updateOptions || data.costEntity.aviaAvailable === false) {
                    newState.isAviaAvailable = data.aviaAvailable;
                }
                newState.loading = false;

                if (data.minCostResults) {
                    newState.minCost = {
                        standard: data.minCostResults.standard && data.minCostResults.standard.cost != 0 ? data.minCostResults.standard.cost : newState.minCost.standard,
                        firstClass: data.minCostResults.firstClass && data.minCostResults.firstClass.cost != 0  ? data.minCostResults.firstClass.cost : newState.minCost.firstClass,
                        ems: data.minCostResults.ems && data.minCostResults.ems.cost != 0 ? data.minCostResults.ems.cost : newState.minCost.ems
                    };
                }

                if (data.productSummaryText) {
                    newState.productSummaryText = data.productSummaryText;
                }

                me.setState(newState);
            });
    } else {
        newState.loading = false;
        me.setState(newState);
    }

}

function getTownName(town) {
    var character = '';
    var i = 0;
    var upperCaseIndex = 0;
    var townName;
    while (i < town.length) {
        character = town.charAt(i);
        if (character == character.toUpperCase() && character != ' ' && character != ',' && character != '-') {
            upperCaseIndex = i;
            break;
        }
        i++;
    }
    townName = town.substring(upperCaseIndex);

    return townName;
}

function calculateCostTime(calculationEntity, mailingStruct, minimumCostEntity, productPageStateParams, callback) {

    var calculationEntity = {
        calculationEntity: calculationEntity,
        costCalculationEntity: mailingStruct,
        minimumCostEntity: minimumCostEntity,
        productPageState: productPageStateParams
    };
    var days = 0;
    $.ajax({
        url: "/calculator/v1/api/delivery.time.cost.get",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(calculationEntity),
        success: function (result) {
            if (result.data) {
                days = callback(result.data);
            }
        },
        error: function () {
            // days = callback(0);
        }
    });
    return days;
}

function calculateMinimumCost(standardMailingStruct, firstClassMailingStruct, emsMailingStruct, callback) {
    var calculationEntity = {
        minimumCostEntity: {
            standard: standardMailingStruct,
            firstClass: firstClassMailingStruct
        }
    };
    if (emsMailingStruct != null) {
        calculationEntity.minimumCostEntity.ems = emsMailingStruct;
    }

    var days = 0;
    $.ajax({
        url: "/calculator/v1/api/delivery.minimum.cost.get",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(calculationEntity),
        success: function (result) {
            if (result.data) {
                days = callback(result.data);
            }
        },
        error: function () {
            // days = callback(0);
        }
    });
    return days;
}

function handleParcelsCityInput(state, me, loadMinCost, updateOptions) {

    if (state.source) {
        state.sourceTown = getTownName(state.source.name);
    }

    if (state.destination) {
        state.destinationTown = getTownName(state.destination.name);
    } else {
        state.destinationTown = "";
        state.international = false;
        state.loading = false;
    }

    if (state.sourceGeoObj && state.destinationGeoObj) {
        var termType = state.ems ? "emsDeliveryTimeRange" : (state.rapid ? "firstClassTime" : "deliveryTime");

        var deliveryNotification = state.services.deliveryNotification;

        var mailingStruct = {
            postingType: state.international ? "MPO" : "VPO",
            weight: state.size.weight * 1000,
            inventory: state.services.inventory,
            smsNotification: state.services.sms,
            zipCodeFrom: "",
            zipCodeTo: "",
            postalCodesFrom: state.sourceIndexes,
            postalCodesTo: state.destinationIndexes
        };

        var isEarthWayForward = state.standard && !state.services.avia;
        if (isEarthWayForward) {
            mailingStruct.wayForward = "EARTH";
        }

        if (!state.international) {
//            mailingStruct.cityFrom = state.sourceTown;
//            mailingStruct.cityTo = state.destinationTown;
            mailingStruct.zipCodeFrom = state.sourceIndex;
            mailingStruct.zipCodeTo = state.destinationIndex;

            if (state.mainType == "banderol") {
                mailingStruct.postingKind = "BANDEROLE";
                mailingStruct.postingCategory = "ORDERED";

                if (state.services.valuable) {
                    mailingStruct.postingCategory = "WITH_DECLARED_VALUE";
                    mailingStruct.declaredValue = state.services.factSum || 1;
                }

                mailingStruct.notificationOfDeliveryRpo = deliveryNotification;
                if (deliveryNotification) {
                    mailingStruct.notificationOfDeliveryRpoCategory = "RPO_ORDERED_VPO";
                }

                if (state.services.firstClass) {
                    mailingStruct.postingKind = "FIRST_CLASS_BANDEROLE";
                    if (deliveryNotification) {
                        mailingStruct.notificationOfDeliveryRpoCategory = "RPO_ORDERED_VPO_FIRST_CLASS";
                    }
                }
            } else if (state.mainType == "standardParcel" || state.mainType == "heavyParcel" || state.mainType == "bigHeavyParcel") {
                mailingStruct.postingKind = "PARCEL";
                mailingStruct.postingCategory = "ORDINARY";
                if (!isEarthWayForward) {
                    mailingStruct.wayForward = "AVIA";
                }

                mailingStruct.notificationOfDeliveryRpo = deliveryNotification;
                if (deliveryNotification) {
                    mailingStruct.notificationOfDeliveryRpoCategory = state.services.registered ? "RPO_ORDERED_VPO" : "RPO_SIMPLE_VPO";
                }

                mailingStruct.carefullyMark = state.services.careful;
                if (state.mainType == "standardParcel") {
                    mailingStruct.parcelKind = "STANDARD";
                }
                if (state.mainType == "heavyParcel") {
                    mailingStruct.parcelKind = "HEAVY";
                }
                if (state.mainType == "bigHeavyParcel") {
                    mailingStruct.parcelKind = "HEAVY_LARGE_SIZED";
                }

                if (state.services.valuable) {
                    mailingStruct.postingCategory = "WITH_DECLARED_VALUE";
                    mailingStruct.declaredValue = state.services.factSum || 1;
                }
            } else if (state.mainType == "ems") {
                mailingStruct.postingKind = "EMS";
                mailingStruct.postingCategory = "ORDINARY";

                if (state.services.valuable) {
                    mailingStruct.postingCategory = "WITH_DECLARED_VALUE";
                    mailingStruct.declaredValue = state.services.factSum || 1;
                }
            }

        } else {
            mailingStruct.countryTo = state.destinationCountryVariants ? state.destinationCountryVariants.code : "";

            if (!isEarthWayForward) {
                mailingStruct.wayForward = "AVIA";
            }

            if (state.mainType != "internationalEms") {
                mailingStruct.notificationOfDeliveryRpo = deliveryNotification;
                if (deliveryNotification) {
                    mailingStruct.notificationOfDeliveryRpoCategory = "RPO_SIMPLE_MPO";
                }
            }

            if (state.mainType == "internationalBanderol") {
                mailingStruct.postingKind = "BANDEROLE";
                mailingStruct.postingCategory = "ORDERED";
            }
            else if (state.mainType == "internationalSmallPacket") {
                mailingStruct.postingKind = "SMALL_PACKAGE";
                mailingStruct.postingCategory = "ORDERED";
            }
            else if (state.mainType == "internationalParcel") {
                mailingStruct.postingKind = "PARCEL";
                mailingStruct.postingCategory = "ORDINARY";
                mailingStruct.carefullyMark = state.services.careful;

                if (state.services.valuable) {
                    mailingStruct.postingCategory = "WITH_DECLARED_VALUE";
                    mailingStruct.declaredValue = state.services.factSum;
                }
            }
            else if (state.mainType == "internationalEms") {
                mailingStruct.postingKind = "EMS";
                mailingStruct.postingCategory = "ORDINARY";
                mailingStruct.postingCategory = "WITH_GOODS";
            }

        }
        // processing parameters for minimum cost calculation
        var minCostParams;
        if (loadMinCost) {
            var type = state.size.type;
            var weight = state.size.weight;
            if (type === "papers" && state.mainType === "standardParcel") {
                type = "items";
            }
            if (state.international) {
                if (type === "papers") {
                    minCostParams = $.extend(true, {}, productCalculatorDefaultParams.internationalParcels[type]);
                } else if (weight === 2 && type === "items") {
                    minCostParams = $.extend(true, {}, productCalculatorDefaultParams.internationalParcels[type]["below5"]);
                } else if (weight > 2) {
                    minCostParams = $.extend(true, {}, productCalculatorDefaultParams.internationalParcels[type]["over5"]);
                }
                minCostParams.ems = $.extend(true, {}, productCalculatorDefaultParams.internationalParcels.ems);
            } else {
                minCostParams = $.extend(true, {}, productCalculatorDefaultParams.parcels[type]);
                minCostParams.ems = $.extend(true, {}, productCalculatorDefaultParams.parcels.ems);
            }
            var minCommonParams = _.omit(mailingStruct, /*'zipCodeTo',*/ "parcelKind", "postingKind", "postingCategory", "notificationOfDeliveryRpo", "inventory", "carefullyMark", "wayForward");

            minCostParams.standard = $.extend(true, minCostParams.standard, minCommonParams);
            minCostParams.firstClass = $.extend(true, minCostParams.firstClass, minCommonParams);
            minCostParams.ems = $.extend(true, minCostParams.ems, minCommonParams);
            if (!state.international) {
                if (state.size.weight === 50) {
                    minCostParams.standard.parcelKind = "HEAVY_LARGE_SIZED";
                } else if (state.size.weight === 20) {
                    minCostParams.standard.parcelKind = "HEAVY";
                    minCostParams.firstClass.parcelKind = "HEAVY";
                }
            }
        }
        var isLetterSendingType = state.size.type === "papers" && _.contains(["internationalBanderol", "banderol", "ems"], state.mainType);
        var calculationEntity = {
            origin: state.sourceGeoObj,
            destination: state.destinationGeoObj,
            sendingType: isLetterSendingType ? "LETTER_PARCEL" : "PACKAGE"
        };
        var productPageStateParams = me.getProductPageStateParams(state);
        calculateCostTime(calculationEntity, mailingStruct, minCostParams, productPageStateParams,
            function (data) {
                state.cost = data.costEntity ? data.costEntity.cost : 0;
                state.term.standardTerm = data.timeEntity.deliveryTime;
                state.term.emsTerm = postProcessEmsTerm(data.timeEntity.emsDeliveryTimeRange);
                state.term.firstClassTerm = data.timeEntity.firstClassTime;

                if (updateOptions || data.costEntity.aviaAvailable === false) {
                    state.isAviaAvailable = data ? data.aviaAvailable : true;
                }
                if (data.minCostResults) {
                    state.minCost = {
                        standard: data.minCostResults.standard ? data.minCostResults.standard.cost : state.minCost.standard,
                        firstClass: data.minCostResults.firstClass ? data.minCostResults.firstClass.cost : state.minCost.firstClass,
                        ems: data.minCostResults.ems ? data.minCostResults.ems.cost : state.minCost.ems
                    };
                }
                if (data.productSummaryText) {
                    state.productSummaryText = data.productSummaryText;
                }
                me.onHandleCityInputComplete(state);
                /*me.setState(state);*/
//                if (!state.international) {
//                    var data = new Object();
//                    var namespace = me.props.portletNamespace;
//                    data[namespace + 'settlement'] = state.destinationTown;
//                    data[namespace + 'region'] = "";
//                    data[namespace + 'district'] = "";
//
//                    $.getJSON(me.props.parcelAccessibilityURL, data, function (result) {
//                        state.bigHeavyProhibited = (result && !result.accessibility);
//                        me.forceUpdate.apply(me);
//                    });
//                } else {
//
//                }
            });
    } else {
        me.onHandleCityInputComplete(state);
    }
}

function getUrlParams() {
    var params = {};

    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function (str, key, value) {
            var decodedKey = decodeURIComponent(key);
            var decodedValue = decodeURIComponent(value.replace(/\+/g, " "));

            if (params[decodedKey]) {
                if (_.isArray(params[decodedKey])) {
                    params[decodedKey].push(decodedValue)
                } else {
                    params[decodedKey] = [params[decodedKey], decodedValue];
                }
            } else {
                params[decodedKey] = decodeURIComponent(decodedValue);
            }
        }
    );

    return params;

}

function postProcessEmsTerm(term) {
    var range = term.split("-");
    if (range.length >= 1) {
        if (range[0] == range[1]) {
            return range[0];
        }
    }
    return term;

}

var indexMap = {
    "Владивосток": "690069",
    "Онега": "164847",
    "Южно-Сахалинск": "693010",
    "Омск": "644018",
    "Мурманск": "183010",
    "Курск": "305014"
};

function getIndexNearby(address, latLon, callback) {

    var date = new Date();
    var currentDateTime = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "T" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    var data = {
        latitude: latLon[0],
        longitude: latLon[1],
        top: 5,
        currentDateTime: currentDateTime,
        offset: 0,
        hidePrivate: true,
        hideTemporaryClosed: true,
        filter: "POSTAL_SERVICES"
    };

    $.ajax({
        url: "/postoffice-api/method/offices.find.nearby.details",
        data: data,
        type: "GET",
        headers: {
            "Accept": "application/json"
        },
        success: function (offices) {
            /*var officeData;*/
            var foundIndexes = [];
            if (offices.length > 0) {

                for (var i = offices.length - 1; i >= 0; i--) {
                    if (!offices[i].isTemporaryClosed) {
                        /*officeData = {
                         postalCode: offices[i].postalCode,
                         settlement: offices[i].settlement
                         };
                         callback(officeData);
                         return;*/
                        foundIndexes.push(offices[i].postalCode);

                    }
                }
                callback(foundIndexes);
                return;
                /*if (!officeData) {
                 officeData = {
                 postalCode: offices[0].postalCode,
                 settlement: offices[0].settlement
                 };
                 }*/

            }
            /*callback(officeData);*/
            callback(foundIndexes);
        },
        error: function () {
            callback(0);
        }
    });
    return null;

}

var docCookies = {
    getItem: function (sKey) {
        if (!sKey) {
            return null;
        }
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
            return false;
        }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
        if (!this.hasItem(sKey)) {
            return false;
        }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
        return true;
    },
    hasItem: function (sKey) {
        if (!sKey) {
            return false;
        }
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
            aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
        }
        return aKeys;
    }
};

function getInternetExplorerVersion() {
    var ie = -1;
    try {
        ie = navigator.userAgent.match(/(MSIE |Trident.*rv[ :])([0-9]+)/)[ 2 ];
    }
    catch (e) {
    }
    return ie;
}

var smartBannerOptions = {
    title: "Почта России",
    author: "Почта России",
    price: "БЕСПЛАТНО",
    appStoreLanguage: "ru",
    inAppStore: "",
    inGooglePlay: "",
    inWindowsStore: "",
    icon: "style/img/logo-smart-banner.png",
    button: "Смотреть",
    scale: 1,
    speedIn: 0,
    speedOut: 0,
    daysHidden: 3000,
    daysReminder: 3000
};

var productsLinks = {
    extraOptions: {
        registered: "/support/post-rules/registered-departure",
        deliveryNotification: "/support/post-rules/notification-of-delivery",
        insurance: "/support/post-rules/valuable-departure",
        inventory: "/support/post-rules/inventory-investment",
        cashOnDelivery: "/support/post-rules/cash-on-delivery",
        careful: "/support/post-rules/the-mark-caution-for-parcels",
        inventoryInvestment: "/support/post-rules/inventory-investment",
        customsDeclaration: "/support/post-rules/customs-declaration"
    },
    letters: {
        envelopesStamps: "/support/letters/envelopes-and-stamps-for-letters",
        typesOfMessages: "/support/post-rules/sending-types",
        howToWriteAdress: "/support/post-rules/write-address",
        tracking: "/tracking",
        letterLimitations: "/support/post-rules/content-package-rules",
        tariffs: "/documents/10231/17590/Тарифы+на+внутреннюю+корреспонденцию+по+РФ/2c1ab6cd-2ec7-4af9-bab0-1b275b3fceea",
        tariffsEms: "http://www.emspost.ru/ru/tarifi_sroki/",
        tariffsInternational: "/documents/10231/17590/%D0%A2%D0%B0%D1%80%D0%B8%D1%84%D1%8B+%D0%BD%D0%B0+%D0%BF%D0%B5%D1%80%D0%B5%D1%81%D1%8B%D0%BB%D0%BA%D1%83+%D0%BC%D0%B5%D0%B6%D0%B4%D1%83%D0%BD%D0%B0%D1%80%D0%BE%D0%B4%D0%BD%D1%8B%D1%85+%D0%BE%D1%82%D0%BF%D1%80%D0%B0%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B9.pdf/9beecb79-4d11-48fe-a939-5d389f2844b9",
        registered: "/support/letters/registered",
        ems: "/support/letters/ems",
        letter: "/support/letters/letter",
        letterRegistered: "/support/letters/registered",
        letterInsured: "/support/letters/valuable",

        firstClass: "/support/letters/first-class",
        firstClassInsured: "/support/letters/valuable-first-class",
        firstClassRegistered: "/support/letters/registered-first-class"
    },
    parcels: {
        typesOfParcelsInner: "/support/parcels/parcel",
        typesOfParcelsOuter: "/support/parcel/types-of-parcels-foreign",
        typesOfParcelsEMS: "/support/parcels/ems",
        tariffsInner: "/support/post-rules/tariffs",
        tariffsOuter: "/documents/10231/17590/%D0%A2%D0%B0%D1%80%D0%B8%D1%84%D1%8B+%D0%BD%D0%B0+%D0%BF%D0%B5%D1%80%D0%B5%D1%81%D1%8B%D0%BB%D0%BA%D1%83+%D0%BC%D0%B5%D0%B6%D0%B4%D1%83%D0%BD%D0%B0%D1%80%D0%BE%D0%B4%D0%BD%D1%8B%D1%85+%D0%BE%D1%82%D0%BF%D1%80%D0%B0%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B9.pdf/9beecb79-4d11-48fe-a939-5d389f2844b9",
        tariffsEMS: "http://www.emspost.ru/ru/",
        packParcel: "/support/post-rules/package-materials",
        packEMSParcel: "/support/post-rules/content-package-rules",
        parcelsLimitations: "/support/post-rules/content-package-rules",
        parcelsLimitationsEMS: "/support/post-rules/content-package-rules",
        fragileParcels: "/support/parcels/fragile-parcels",
        valuable: "/support/parcels/valuable",

        internationalEms: "/support/parcels/ems",
        ems: "/support/parcels/ems",
        internationalBanderol: "/support/banderoles/banderole",
        banderol: "/support/banderoles/banderole",
        banderolValuable: "/support/banderoles/valuable",
        banderolRegistered: "/support/banderoles/registered",

        banderolFirstClassRegistered: "/support/banderoles/registered-first-class",
        banderolFirstClassValuable: "/support/banderoles/valuable-first-class",
        internationalSmallPacket: "/support/parcels/registered-small-package",
        standardParcel: "/support/parcels/parcel"
    },
    postcards: {
        tariffs: "/documents/10231/17590/%D0%A2%D0%B0%D1%80%D0%B8%D1%84%D1%8B+%D0%BD%D0%B0+%D0%B4%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D0%BA%D1%83+%D0%BF%D0%B8%D1%81%D0%B5%D0%BC.pdf/505fb1e9-3834-4597-bb88-9d859cb7348d",
        howToWriteAdress: "/support/post-rules/write-address",
        typesOfPostcards: "/support/other-products/postcard",
        tariffsInternational: "https://pochta.ru/documents/10231/17590/%D0%A2%D0%B0%D1%80%D0%B8%D1%84%D1%8B+%D0%BD%D0%B0+%D0%BF%D0%B5%D1%80%D0%B5%D1%81%D1%8B%D0%BB%D0%BA%D1%83+%D0%BC%D0%B5%D0%B6%D0%B4%D1%83%D0%BD%D0%B0%D1%80%D0%BE%D0%B4%D0%BD%D0%BE%D0%B8%CC%86+%D0%BF%D0%B8%D1%81%D1%8C%D0%BC%D0%B5%D0%BD%D0%BD%D0%BE%D0%B8%CC%86+%D0%BA%D0%BE%D1%80%D1%80%D0%B5%D1%81%D0%BF%D0%BE%D0%BD%D0%B4%D0%B5%D0%BD%D1%86%D0%B8%D0%B8+-+Google+%D0%94%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B.pdf/5158b2d6-b104-433c-bc44-820fcea25127",
        typesOfPostcards: "/support/other-products/postcard",
        sendingViaMailbox: "/support/other-products/postcard",
        registered: "/support/other-products/postcard"
    },
    moneytransfer: {
        common: "/support/money-transfer/common-info",
        forsage: "/support/money-transfer/forsage",
        mailTransfer: "/support/money-transfer/mail-transfer"
    },
    blanks: {
        dadata: "https://passport.russianpost.ru/suggestions/api/4_1/rs/suggest/address"
    }
};

var productCalculatorDefaultParams = {

    letters: {
        standard: {
            postingKind: "LETTER",
            postingType: "VPO",
            postingCategory: "SIMPLE",
            weight: 20,
            notificationOfDeliveryRpo: false,
            inventory: false,
            zipCodeFrom: "107031",
            zipCodeTo: "107031"
        },
        firstClass: {
            postingKind: "FIRST_CLASS_LETTER",
            postingType: "VPO",
            postingCategory: "SIMPLE",
            weight: 20,
            notificationOfDeliveryRpo: false,
            inventory: false,
            carefullyMark: false,
            zipCodeFrom: "107031",
            zipCodeTo: "107031"
        },
        ems: {
            postingKind: "EMS",
            postingType: "VPO",
            postingCategory: "ORDINARY",
            weight: 20,
            notificationOfDeliveryRpo: false,
            inventory: false,
            carefullyMark: false,
            zipCodeFrom: "107031",
            zipCodeTo: "107031"
        }
    },
    internationalLetters: {
        standard: {
            postingKind: "LETTER",
            postingType: "MPO",
            postingCategory: "SIMPLE",
            weight: 20,
            notificationOfDeliveryRpo: false,
            inventory: false,
            zipCodeFrom: "107031",
            zipCodeTo: "",
            wayForward: "EARTH"
        },
        firstClass: {
            postingKind: "LETTER",
            postingType: "MPO",
            postingCategory: "SIMPLE",
            weight: 20,
            notificationOfDeliveryRpo: false,
            inventory: false,
            carefullyMark: false,
            zipCodeFrom: "107031",
            zipCodeTo: "",
            wayForward: "AVIA"
        },
        ems: {
            postingKind: "EMS",
            postingType: "MPO",
            postingCategory: "WITH_DOCUMENTS",
            weight: 20,
            notificationOfDeliveryRpo: false,
            inventory: false,
            carefullyMark: false,
            zipCodeFrom: "107031",
            zipCodeTo: ""
        }
    },
    parcels: {
        papers: {
            standard: {
                "postingType": "VPO",
                "wayForward": "EARTH",
                "weight": 2000,
                "zipCodeFrom": "394009",
                "zipCodeTo": "400074",
                "postingKind": "BANDEROLE",
                "postingCategory": "ORDERED"
            },
            firstClass: {
                "postingType": "VPO",
                "wayForward": "AVIA",
                "weight": 2000,
                "zipCodeFrom": "394009",
                "zipCodeTo": "400074",
                "postingKind": "FIRST_CLASS_BANDEROLE",
                "postingCategory": "ORDERED"
            }
        },
        items: {
            standard: {
                postingType: "VPO",
                wayForward: "EARTH",
                weight: 2000,
                zipCodeFrom: "107031",
                zipCodeTo: "107031",
                postingKind: "PARCEL",
                postingCategory: "ORDINARY",
                parcelKind: "STANDARD"
            },
            firstClass: {
                postingType: "VPO",
                wayForward: "AVIA",
                weight: 2000,
                zipCodeFrom: "692168",
                zipCodeTo: "692168",
                postingKind: "PARCEL",
                postingCategory: "ORDINARY",
                parcelKind: "STANDARD"
            }
        },
        ems: {
            postingType: "VPO",
            wayForward: "AVIA",
            weight: 2000,
            zipCodeFrom: "107031",
            zipCodeTo: "107031",
            postingKind: "EMS",
            postingCategory: "ORDINARY"
        }

    },
    internationalParcels: {
        papers: {
            firstClass: {
                "postingType": "MPO",
                "wayForward": "AVIA",
                "weight": 2000,
                "zipCodeFrom": "",
                "zipCodeTo": "",
                "countryTo": 826,
                "postingKind": "BANDEROLE",
                "postingCategory": "ORDERED"
            }
        },
        items: {
            below5: {

                firstClass: {
                    postingType: "MPO",
                    wayForward: "AVIA",
                    weight: 2000,
                    zipCodeFrom: "",
                    zipCodeTo: "",
                    countryTo: 826,
                    postingKind: "SMALL_PACKAGE",
                    postingCategory: "ORDERED"
                }
            },
            over5: {
                standard: {
                    postingType: "MPO",
                    wayForward: "EARTH",
                    weight: 5000,
                    zipCodeFrom: "",
                    zipCodeTo: "",
                    countryTo: 276,
                    postingKind: "PARCEL",
                    postingCategory: "ORDINARY"
                },
                firstClass: {
                    postingType: "MPO",
                    wayForward: "AVIA",
                    weight: 5000,
                    zipCodeFrom: "",
                    zipCodeTo: "",
                    countryTo: 276,
                    postingKind: "PARCEL",
                    postingCategory: "ORDINARY"
                }
            }
        },


        ems: {
            postingType: "MPO",
            wayForward: "AVIA",
            weight: 2000,
            zipCodeFrom: "107031",
            zipCodeTo: "",
            postingKind: "EMS",
            postingCategory: "WITH_GOODS"
        }

    },
    postcards: {
        standard: {
            postingType: "VPO",
            postingKind: "POST_CARD",
            postingCategory: "SIMPLE",
            weight: 20,
            notificationOfDeliveryRpo: false
        },
        firstClass: {
            postingType: "VPO",
            postingKind: "POST_CARD",
            postingCategory: "SIMPLE",
            weight: 20,
            notificationOfDeliveryRpo: false
        }

    }

};

var CitiesCourierAvailabilityMixin = {
    //will be moved to nsi
    cities: [
        "Москва",
        "Московская область",
        "Санкт-Петербург",
        "Белгород",
        "Владивосток",
        "Волгоград",
        "Воронеж",
        "Екатеринбург",
        "Ижевск",
        "Иркутск",
        "Казань",
        "Калининград",
        "Краснодар",
        "Красноярск",
        "Нижний Новгород",
        "Новосибирск",
        "Омск",
        "Пермь",
        "Ростов-на-Дону",
        "Самара",
        "Тверь",
        "Томск",
        "Тула",
        "Тюмень",
        "Уфа",
        "Хабаровск",
        "Челябинск",
        "Южно-Сахалинск",
        "Якутск",
        "Ярославль"
    ],
    determineCourierAvailability: function () {
        var hasCourierDelivery = _.contains(this.cities, this.state.source.name) || this.isMoscowDistrict();
        return hasCourierDelivery;
    },

    isMoscowDistrict: function() {
        var moscowDistrict = ["Москва", "Московская область"];
        return _.contains(moscowDistrict, this.state.sourceGeoObj.region);
    }
};