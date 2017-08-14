class ResourceLoader {
    constructor() {
        this.localServerBaseUrl = 'http://localhost:4567'
        this.budgetsRoute = '/budgets'
        this.expenditureRoute = '/actual-expenditure'
    }

    loadFileSync(resource, callback) {
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/json");
        xhr.open('GET', resource, false);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                callback(xhr.responseText);
            }
        };
        xhr.send(null);
    };

    loadSingleBudgetFile() {
        let result = "";
        const _this = this;

        this.loadFileSync(this.localServerBaseUrl + this.budgetsRoute, function(response) {
            const fileNameArr = JSON.parse(response);
            _this.loadFileSync(_this.budgetsRoute + "/" + fileNameArr[0], function(data) {
                result = JSON.parse(data);
            })
        });
        return result;
    }

    loadActualExpenditureFiles() {
        let result = [];
        const _this = this;

        this.loadFileSync(this.localServerBaseUrl + this.expenditureRoute, function(response) {
            const fileNamesArr = JSON.parse(response);
            fileNamesArr
                .sort()
                .reverse()
                .forEach(filename => _this.loadFileSync(_this.expenditureRoute + "/" + filename, function(data) {
                    result.push(JSON.parse(data));
                }))
        });
        return result;
    }
}