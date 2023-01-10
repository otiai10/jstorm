/// <reference types="@types/react" />
/// <reference types="@types/react-dom" />
declare var React;
declare var ReactDOM;

/**
 * In your project, please use
 *   import { Model } from "jstorm/browser/local";
 */
// import types from "react";
import { Model } from "../lib/browser/local";

class Item extends Model {
    static override __namespace__ = "Item";
    public title: string;
    public status: number;
}

const ItemView: React.FunctionComponent<{
    item: Item,
    refresh: () => void,
}> = ({ item, refresh }) => {
    return (
        <div className="row">
            <div className="column column-50">
                <div>{item.title}</div>
                <div style={{fontSize: "xx-small"}}>id:{item._id}</div>
            </div>
            <div className="column column">{item.status}</div>
            <div className="column column">
                {item.status == 0 ?
                    <a className="button" onClick={async () => await item.update({status: 1}) && refresh()}>DONE</a>
                    : <a className="button button-clear" onClick={async () => await item.update({status: 0}) && refresh()}>UNDO</a>
                }
            </div>
            <div className="column column">
                <a className="button button-outline" onClick={async () => await item.delete() && refresh()}>DELETE</a>
            </div>
        </div>
    )
};

const App: React.FunctionComponent = () => {
    const refresh = () => { window.location.reload() };
    const [items, setItems] = React.useState([]);
    const [draft, setDraft] = React.useState("");
    React.useEffect(() => Item.list().then(setItems), []);
    return (
        <div className="container" style={{ paddingTop: "16px" }}>
            <div className="row">
                <div className="column">
                    <h1>TODO App Example by <a href="https://github.com/otiai10/jstorm">jstorm</a></h1>
                </div>
            </div>
            <div className="row">
                <div className="column">
                    <pre><code>{`// Import from "jstorm/browser/local" for localStorage:
import { Model } from "jstorm/browser/local";

// Define your model:
class Item extends Model {
    static override __namespace__ = "Item";
    public title: string;
    public status: number;
}

// Now, let's begin:`}</code></pre>
                </div>
            </div>

            <div className="row">
                <div className="column column-40">
                    <input type="text"
                        placeholder="New item title here"
                        onChange={ev => setDraft(ev.target.value)}
                    />
                </div>
                <div className="column">
                    <input type="button" value="ADD"
                        onClick={async () => await Item.create({title: draft, status: 0}) && refresh()}
                    />
                </div>
                <div className="column column-40">
                    <pre><code>{`// Insert new item:
const item = await Item.create({title: text, status: 0})`}</code></pre>
                </div>
            </div>
            <div className="row">
                <div className="column column-60">
                    {items.map(item => <ItemView key={item._id} item={item} refresh={refresh} />)}
                </div>
                <div className="column column-40">
                    <pre><code>{`// Update:
item.update({status: 1});

// Delete:
item.delete();`}</code></pre>
                </div>
            </div>

        </div>
    )
};

const e = document.getElementById("root");
const root = ReactDOM.createRoot(e);
root.render(<App />);
