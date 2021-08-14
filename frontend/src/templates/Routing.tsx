import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Home from "../pages/Home";
import { Layout } from './Layout';

export function Routing() {
  return (
    <BrowserRouter>
      <Layout>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
        </Switch>
      </Layout>
    </BrowserRouter>
  )
}
