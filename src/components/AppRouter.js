import React from 'react'
import {Route} from "react-router-dom"
import Game from "./Game"
import Contacts from "./Contacts"
import About from "./About"
import Admin from "./Admin"
import Login from "./Login"
import Registration from "./Registration"

class AppRouter extends React.Component {
    render() {
        return (
            <div id="router" display="none">
                <Route exact path='/' component={Game} />
                <Route path='/contacts' component={Contacts} />
                <Route path='/about' component={About} />
                <Route path='/admin' component={Admin} />   
                <Route path='/login' component={Login} />
                <Route path="/registration" component={Registration} />
            </div>
        )
    }
}

export default AppRouter