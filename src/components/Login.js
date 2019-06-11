import React from 'react'
import {Link, Redirect} from 'react-router-dom'
import "../css/Login.css"
const SHA256 = require("crypto-js/sha256");


class Login extends React.Component {
    constructor(props) {
        super(props);
        this.updateState = this.updateState.bind(this);
        this.submit = this.submit.bind(this);
        this.state = {
            email: "",
            password: "",
            isLoggined: false,
            message: ""
        };
    }
    updateState(event) {
        this.setState({[event.target.name]: event.target.value});
    }
    submit(event) {
        let passwordHash = SHA256(this.state.password).toString();
        fetch(`/login?email=${this.state.email}&password=${passwordHash}`, {method: 'GET'}).then((res) => {
            if (res.status === 200) {
                res.json().then((result) => {
                    localStorage.setItem("jwt", result.jwt);
                    this.setState({"isLoggined": true});
                }).catch((err) => {
                    console.log(err);
                });
            }
            else if (res.status === 203) {
                this.setState({message: "Account wtih this email doesn`t exist"});
            }
            else if (res.status === 204) {
                this.setState({message: "Wrong password"});
            }
        });
    }
    render() {
        return (
            <div id="login_main"> 
                <span className="email_title">Email</span><input name="email" onChange={this.updateState}/><br/>
                <span className="password_title">Password</span><input name="password" type="password" onChange={this.updateState}/><br/>
                <button onClick={this.submit}>Login</button>
                {(() => {
                    if (this.state.message !== "") return <span className="message">{this.state.message}</span>}
                )()}<br/>
                <span>Don`t have an account?</span><Link to="/registration">Sign up</Link><br/>
                <span><Link to="/">On main page</Link></span>
                {(this.state.isLoggined) ? <Redirect to="/"/> : null}
            </div>
        )
    }
}

export default Login