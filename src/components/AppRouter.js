import React from 'react'
import {Route} from "react-router-dom"
import Game from "./Game"
import Contacts from "./Contacts"
import About from "./About"
import Admin from "./Admin"


class AppRouter extends React.Component {
    render() {
        return (
            <div id="router" display="none">
                <Route exact path='/' component={Game} />
                <Route path='/contacts' component={Contacts} />
                <Route path='/about' component={About} />
                <Route path='/admin' component={Admin} />   
            </div>
        )
    }
}

export default AppRouter