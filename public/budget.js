const jsonFiles = ["./budgets/budget-2017-2018.json", "./actual-expenditure/actual-expenditure-2017-05.json", "./actual-expenditure/actual-expenditure-2017-06.json"];
const numberOfMonths = jsonFiles.length - 1;
let budget;
let budgetLastMonth;

const loadFileSync = function(file, callback) {
    const xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('GET', file, false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
};

const _addMonthlyBudgetTotals = function(monthData, monthlyBudgetData) {
    monthData["categories"].forEach(category => {
        const budgetDataForCategory = monthlyBudgetData["categories"]
            .filter(cat => category.title === cat.title)[0];
        category["data"].forEach(dataItem => {
            const budgetDataForDataItem = budgetDataForCategory["data"]
                .filter(item => item["name"] === dataItem["name"])[0];
            dataItem["monthly_budget"] = budgetDataForDataItem["monthly_budget"];
        });
    })
};

const loadJsonFromFS = function() {
    let monthlyBudgetTotals;

    loadFileSync(jsonFiles[0], function (response) {
        monthlyBudgetTotals = JSON.parse(response);
    });

    loadFileSync(jsonFiles[1], function (response) {
        budgetLastMonth = JSON.parse(response);
        _addMonthlyBudgetTotals(budgetLastMonth, monthlyBudgetTotals)
    });

    loadFileSync(jsonFiles[2], function (response) {
        budget = JSON.parse(response);
        _addMonthlyBudgetTotals(budget, monthlyBudgetTotals)
    });
};


const _categoryData = function(title) {
    const matchingCategory = budget.categories.filter(function (item) {
        return item.title === title;
    });
    return matchingCategory[0].data;
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
                    const estimated = _categoryData(name)[d.index].estimated;
                    if (estimated) {
                        return '990099'
                    }
                    const monthlyBudget = _categoryData(name)[d.index].monthly_budget;
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


const amalgamatedJson = function (array, name) {
    const data = [];
    array.forEach(function (item) {
        let budgetTotal = 0;
        let actualTotal = 0;
        let dataElement = item.data;
        if (!item.data) {
            dataElement = array
        }
        dataElement.forEach(function (monthItem) {
            budgetTotal = budgetTotal + monthItem.monthly_budget;
            actualTotal = actualTotal + monthItem.actual;
        });
        const object = {};
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

const combineMonthData = function(categories) {
    const result = [];
    categories[0].forEach(function(category) {
        result.push({
            "title": category["title"],
            "data": category["data"]
        });
        const lastEntry = result[result.length - 1];
        const titleToFind = lastEntry["title"];
        let nameToFind;
        const findTitle = function (category) {
            return category.title === titleToFind
        };

        const findName = function (dataItem) {
            return dataItem.name === nameToFind
        };
        const correspondingCategory = categories[1].find(findTitle);
        lastEntry["data"].forEach(function(dataItem) {
            nameToFind = dataItem["name"];
            const correspondingItem = correspondingCategory["data"].find(findName);
            dataItem["monthly_budget"] += correspondingItem["monthly_budget"];
            dataItem["actual"] += correspondingItem["actual"]
        });
    });
    return result;
};

loadJsonFromFS();
const inYourHome = new Category("In your home", "#in-your-home", 1000);
const insurance = new Category("Insurance", "#insurance");
const eatsAndDrinks = new Category("Eats and drinks", "#eats-and-drinks");
const motoringAndPublicTransport = new Category("Motoring and public transport", "#motoring-and-public-transport");
const savingsAndInvestments = new Category("Savings and investments", "#savings-and-investments");
const family = new Category("Family", "#family");
const fun = new Category("Fun", "#fun");
const healthAndBeauty = new Category("Health and beauty", "#health-and-beauty");
const clothes = new Category("Clothes", "#clothes");
const bigOneOffs = new Category("Big one offs", "#big-one-offs");
const oddsAndSods = new Category("Odds and sods", "#odds-and-sods");
const monthOverview = amalgamatedJson(budget.categories);
const lastMonthOverview = amalgamatedJson(budgetLastMonth.categories);
const monthlyTotal = [amalgamatedJson(monthOverview, budget.month + " " + budget.year)[0]];
const lastMonthlyTotal = [amalgamatedJson(lastMonthOverview, budgetLastMonth.month + " " + budgetLastMonth.year)[0]];

const _annualTotal = function () {
    const result = {};
    const monthlyBudget = monthlyTotal[0].monthly_budget;
    result.actual = monthlyTotal[0].actual + lastMonthlyTotal[0].actual;
    result.monthly_budget = monthlyBudget * numberOfMonths;
    result.annual_budget = monthlyBudget * 12;
    result.name = "2017-2018";
    return [result];
};

const monthTotal = c3.generate({
    bindto: '#month-total',
    data: {
        labels: true,
        x: 'x',
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

const monthlyOverview = c3.generate({
    bindto: '#month-overview',
    data: {
        labels: true,
        x: 'x',
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

const yearTotal = c3.generate({
    bindto: '#year-total',
    data: {
        labels: true,
        x: 'x',
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

const yearOverview = c3.generate({
    bindto: '#year-overview',
    data: {
        labels: true,
        x: 'x',
        json: amalgamatedJson(combineMonthData([budget.categories, budgetLastMonth.categories])),
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