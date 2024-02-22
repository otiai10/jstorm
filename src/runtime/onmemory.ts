
export function OnMemoryStorage() {
    this._data_ = {};
    this.getItem = function (key) {
        return this._data_[key];
    }
    this.setItem = function (key, value) {
        this._data_[key] = value;
    }
    this.removeItem = function (key) {
        delete this._data_[key];
    }
    this.clear = function () {
        this._data_ = {};
    }
}