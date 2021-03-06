const resourceLoader = new ResourceLoader();
const budgetData = resourceLoader.loadSingleBudgetFile();
const actualExpenditureData = resourceLoader.loadActualExpenditureFiles();
const numberOfMonths = actualExpenditureData.length;

const _addMonthlyBudgetTotals = function(monthData, monthlyBudgetData) {
    monthData["categories"].forEach(category => {
        const budgetDataForCategory = monthlyBudgetData["categories"]
            .find(cat => category.title === cat.title);
        category["data"].forEach(dataItem => {
            const budgetDataForDataItem = budgetDataForCategory["data"]
                .find(item => item["name"] === dataItem["name"]);
            dataItem["monthly_budget"] = budgetDataForDataItem["monthly_budget"];
        });
    });
    return monthData;
};

const budget = _addMonthlyBudgetTotals(actualExpenditureData[0], budgetData);
const budgetLastMonth = _addMonthlyBudgetTotals(actualExpenditureData[1], budgetData);
const budgetTwoMonthsAgo = _addMonthlyBudgetTotals(actualExpenditureData[2], budgetData);

const _categoryData = function(title) {
    return budget.categories.find(item => item.title === title).data;
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


const amalgamatedJson = function(array, name) {
    const data = [];
    array.forEach(item => {
        let budgetTotal = 0;
        let actualTotal = 0;
        let dataElement = item.data;
        if (!item.data) {
            dataElement = array
        }
        dataElement.forEach(monthItem => {
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

const combineMonthData = function(monthsData) {
    const result = [];
    const firstMonthCopy = JSON.parse(JSON.stringify(monthsData[0]));
    firstMonthCopy.forEach(mainCategory => {
        const categoryData = mainCategory["data"].slice(0);
        result.push(
            {
                "title": mainCategory["title"],
                "data": categoryData
            }
        )
    });

    const addMonthData = function(month) {
        month.forEach(mainCategory => {
            const titleToFind = mainCategory["title"];
            let nameToFind;
            const findTitle = function(category) {
                return category.title === titleToFind
            };

            const findName = function(dataItem) {
                return dataItem.name === nameToFind
            };
            const correspondingResultMainCategory = result.find(findTitle);
            mainCategory["data"].forEach(category => {
                nameToFind = category["name"];
                const correspondingResultItem = correspondingResultMainCategory["data"].find(findName);
                correspondingResultItem["actual"] += category["actual"];
                correspondingResultItem["monthly_budget"] += category["monthly_budget"]
            })
        })
    };

    const secondMonthCopy = monthsData[1].slice(0);
    addMonthData(secondMonthCopy);
    const thirdMonthCopy = monthsData[1].slice(0);
    addMonthData(thirdMonthCopy);
    return result;
};

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
const twoMonthsAgoOverview = amalgamatedJson(budgetTwoMonthsAgo.categories);
const monthlyTotal = [amalgamatedJson(monthOverview, budget.month + " " + budget.year)[0]];
const lastMonthlyTotal = [amalgamatedJson(lastMonthOverview, budgetLastMonth.month + " " + budgetLastMonth.year)[0]];
const twoMonthsAgoMonthlyTotal = [amalgamatedJson(twoMonthsAgoOverview, budgetLastMonth.month + " " + budgetLastMonth.year)[0]];

const _annualTotal = function () {
    const result = {};
    const monthlyBudget = monthlyTotal[0].monthly_budget;
    result.actual = monthlyTotal[0].actual + lastMonthlyTotal[0].actual + twoMonthsAgoMonthlyTotal[0].actual;
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
                const monthlyBudget = monthlyTotal[d.index].monthly_budget;
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
                const monthlyBudget = amalgamatedJson(budget.categories)[d.index].monthly_budget;
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
                const monthlyBudget = _annualTotal()[d.index].monthly_budget;
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
        json: amalgamatedJson(combineMonthData([budget.categories, budgetLastMonth.categories, budgetTwoMonthsAgo.categories])),
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
                const monthlyBudget = amalgamatedJson(budget.categories)[d.index].monthly_budget;
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