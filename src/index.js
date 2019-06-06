import React from 'react';
import ReactDOM from 'react-dom';
import AppRouter from './components/AppRouter';
import * as serviceWorker from './serviceWorker';
import {BrowserRouter as Router} from "react-router-dom";

class App extends React.Component {
    render() {
        return (
            <Router>
                <AppRouter/>
            </Router>
        )
    }
}
ReactDOM.render(<App/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
