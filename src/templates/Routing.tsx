import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Client from '../pages/Client';
import Home from "../pages/Home";
import { London } from '../pages/London';
import { Layout } from './Layout';

export function Routing() {
  return (
    <BrowserRouter>
      <Layout>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/london">
            <London />
          </Route>
          <Route exact path="/:id">
            <Client />
          </Route>
        </Switch>
      </Layout>
    </BrowserRouter>
  )
}