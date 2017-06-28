var jsonFiles = ["./data-2017-05.json", "./data-2017-06.json"];
var numberOfMonths = jsonFiles.length;
var budget;
var budgetLastMonth;

var loadFileSync = function(file, callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('GET', file, false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
};

var loadJsonFromFS = function() {
    loadFileSync(jsonFiles[1], function (response) {
        budget = JSON.parse(response);
    });

    loadFileSync(jsonFiles[0], function (response) {
        budgetLastMonth = JSON.parse(response);
    });
};

function Category(name, binding, height) {
    this.name = name;
    this.binding = binding;
    this.height = height;
    this.c3Data = {
        bindto: this.binding,
        data: {
            labels: true,
            x: 'x',
            json: _categoryData(this.name),
            keys: {
                x: 'name',
                value: ['monthly_budget', 'actual']
            },
            type: 'bar',
            color: function (color, d) {
                if (!d.id && d === 'monthly_budget') {
                    return '#cce5ff'
                } else if (d.id === 'monthly_budget') {
                    return '#cce5ff'
                } else if (d.id) {
                    var estimated = _categoryData(name)[d.index].estimated;
                    if (estimated) {
                        return '990099'
                    }
                    var monthlyBudget = _categoryData(name)[d.index].monthly_budget;
                    return d.id === 'actual' && d.value > monthlyBudget ? '#ff0000' : '#33cc33';
                }
            }
        },
        bar: {
            width: {
                ratio: 0.5
            }
        },
        axis: {
            rotated: true,
            x: {
                type: 'category'
            }
        }
    };

    if (this.height !== null) {
        this.c3Data.size = {
            height: this.height
        }
    }

    c3.generate(this.c3Data);
}

var _categoryData = function(title) {
    var matchingCategory = budget.categories.filter(function(item) {
        return item.title === title;
    });
    return matchingCategory[0].data;
};

var amalgamatedJson = function(array, name) {
    var data = [];
    array.forEach(function(item) {
        var budgetTotal = 0;
        var actualTotal = 0;
        var dataElement = item.data;
        if (!item.data) {
            dataElement = array
        }
        dataElement.forEach(function(monthItem) {
            budgetTotal = budgetTotal + monthItem.monthly_budget;
            actualTotal = actualTotal + monthItem.actual;
        });
        var object = {};
        object.name = item.title;
        if (!item.title) {
            object.name = name;
        }
        object.monthly_budget = budgetTotal;
        object.actual = actualTotal;
        if (object.name !== "Refurbishments") {
            data.push(object)
        }
    });
    return data
};

var combineMonthData = function (categories) {
    var result = [];
    categories[0].forEach(function (category) {
        result.push({
            "title": category["title"],
            "data": category["data"]
        });
        var lastEntry = result[result.length - 1];
        var titleToFind = lastEntry["title"];
        var nameToFind;
        var findTitle = function (category) {
            return category.title === titleToFind
        };

        var findName = function (dataItem) {
            return dataItem.name === nameToFind
        };
        var correspondingCategory = categories[1].find(findTitle);
        lastEntry["data"].forEach(function (dataItem) {
            nameToFind = dataItem["name"];
            var correspondingItem = correspondingCategory["data"].find(findName);
            dataItem["monthly_budget"] += correspondingItem["monthly_budget"];
            dataItem["actual"] += correspondingItem["actual"]
        });
    });
    return result;
};

loadJsonFromFS();
var inYourHome = new Category("In your home", "#in-your-home", 1000);
var insurance = new Category("Insurance", "#insurance");
var eatsAndDrinks = new Category("Eats and drinks", "#eats-and-drinks");
var motoringAndPublicTransport = new Category("Motoring and public transport", "#motoring-and-public-transport");
var savingsAndInvestments = new Category("Savings and investments", "#savings-and-investments");
var family = new Category("Family", "#family");
var fun = new Category("Fun", "#fun");
var healthAndBeauty = new Category("Health and beauty", "#health-and-beauty");
var clothes = new Category("Clothes", "#clothes");
var bigOneOffs = new Category("Big one offs", "#big-one-offs");
var oddsAndSods = new Category("Odds and sods", "#odds-and-sods");
var monthOverview = amalgamatedJson(budget.categories);
var lastMonthOverview = amalgamatedJson(budgetLastMonth.categories);
var monthlyTotal = [amalgamatedJson(monthOverview, budget.month + " " + budget.year)[0]];
var lastMonthlyTotal = [amalgamatedJson(lastMonthOverview, budgetLastMonth.month + " " + budgetLastMonth.year)[0]];

var _annualTotal = function() {
    var result = {};
    var monthlyBudget = monthlyTotal[0].monthly_budget;
    result.actual = monthlyTotal[0].actual + lastMonthlyTotal[0].actual;
    result.monthly_budget = monthlyBudget * numberOfMonths;
    result.annual_budget = monthlyBudget * 12;
    result.name = "2017-2018";
    return [result];
};

var monthTotal = c3.generate({
    bindto: '#month-total',
    data: {
        labels: true,
        x : 'x',
        json: monthlyTotal,
        keys: {
            x: 'name',
            value: ['monthly_budget', 'actual']
        },
        type: 'bar',
        color: function (color, d) {
            if (!d.id && d === 'monthly_budget') {
                return '#cce5ff'
            } else if (d.id === 'monthly_budget') {
                return '#cce5ff'
            } else if (d.id) {
                var monthlyBudget = monthlyTotal[d.index].monthly_budget;
                return d.id === 'actual' && d.value > monthlyBudget ? '#ff0000' : '#33cc33';
            }
        }
    },
    bar: {
        width: {
            ratio: 0.5
        }
    },
    axis: {
        rotated: true,
        x: {
            type: 'category'
        }
    }
});

var monthlyOverview = c3.generate({
    bindto: '#month-overview',
    data: {
        labels: true,
        x : 'x',
        json: amalgamatedJson(budget.categories),
        keys: {
            x: 'name',
            value: ['monthly_budget', 'actual']
        },
        type: 'bar',
        color: function (color, d) {
            if (!d.id && d === 'monthly_budget') {
                return '#cce5ff'
            } else if (d.id === 'monthly_budget') {
                return '#cce5ff'
            } else if (d.id) {
                var monthlyBudget = amalgamatedJson(budget.categories)[d.index].monthly_budget;
                return d.id === 'actual' && d.value > monthlyBudget ? '#ff0000' : '#33cc33';
            }
        }
    },
    bar: {
        width: {
            ratio: 0.5
        }
    },
    axis: {
        rotated: true,
        x: {
            type: 'category'
        }
    }
});

var yearTotal = c3.generate({
    bindto: '#year-total',
    data: {
        labels: true,
        x : 'x',
        json: _annualTotal(),
        keys: {
            x: 'name',
            value: ['annual_budget', 'monthly_budget', 'actual']
        },
        type: 'bar',
        color: function (color, d) {
            if (!d.id && d === 'monthly_budget') {
                return '#cce5ff'
            } else if (d.id === 'monthly_budget') {
                return '#cce5ff'
            } else if (d.id === 'annual_budget') {
                return 'gray'
            } else if (d.id) {
                var monthlyBudget = _annualTotal()[d.index].monthly_budget;
                return d.id === 'actual' && d.value > (monthlyBudget * numberOfMonths) ? '#ff0000' : '#33cc33';
            }
        }
    },
    bar: {
        width: {
            ratio: 0.5
        }
    },
    axis: {
        rotated: true,
        x: {
            type: 'category'
        }
    }
});

var yearOverview = c3.generate({
    bindto: '#year-overview',
    data: {
        labels: true,
        x : 'x',
        json: amalgamatedJson(combineMonthData([budget.categories, budgetLastMonth.categories])),
        keys: {
            x: 'name',
            value: ['monthly_budget', 'actual']
        },
        type: 'bar',
        color: function (color, d) {
            if (!d.id && d === 'monthly_budget') {
                return '#cce5ff'
            } else if (d.id === 'monthly_budget') {
                return '#cce5ff'
            } else if (d.id) {
                var monthlyBudget = amalgamatedJson(budget.categories)[d.index].monthly_budget;
                return d.id === 'actual' && d.value > monthlyBudget ? '#ff0000' : '#33cc33';
            }
        }
    },
    bar: {
        width: {
            ratio: 0.5
        }
    },
    axis: {
        rotated: true,
        x: {
            type: 'category'
        }
    }
});