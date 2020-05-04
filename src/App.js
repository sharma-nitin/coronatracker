import React from 'react';
import { BrowserRouter, Switch, Route, withRouter } from 'react-router-dom';
import { getSummaryStats } from './api';
import Countries from './components/Countries/Countries';
import Country from './components/Country/Country';
import Footer from './layouts/Footer';
import Header from './layouts/Header';
import Spinner from './components/Spinner/Spinner';
import Summary from './components/Summary/Summary';
import Error from './components/Error/Error';
import { getZoneinfo } from '../src/api';

import './main.scss';
let recievedMessage='';
let zoneinfo;
export const LoadingContext = React.createContext({
  loading: true,
  setLoading: () => { },
});

function App() {
  const [error, setError] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const value = { loading, setLoading };

  const [data, setData] = React.useState({
    Global: {
      TotalConfirmed: 0,
      TotalDeaths: 0,
      TotalRecovered: 0,
    },
    Countries: [],
    FilteredCountries: [],
    Date: undefined,
  });

  const loadData = async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await getSummaryStats();
      setData({ ...res, FilteredCountries: res.Countries });
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setError(true);
    }
  };

  React.useEffect(() => {
    loadData();
    getZoneinfo().then(data=>{
      zoneinfo=data.zones;
    })
  }, []);

  const countryFilter = (e) => {
    setData({
      ...data,
      FilteredCountries: data.Countries.filter((item) => {
        return item.Country.toLowerCase().indexOf(e.target.value.toLowerCase()) !== -1;
      }),
    });
  };

  const handleEvent = () => {
    const chatWidget = document.querySelector('chat-widget');
    chatWidget.addEventListener('requestedMessage', (event) => {
      if(recievedMessage !==event.detail){
        //api call to be made here and proper response to be returned in chatWidget.responseMessage
        recievedMessage=event.detail;
        chatResponse(event.detail)
       // chatWidget.responseMessage=event.detail;
      }
    })
  }

  const chatResponse=(message)=>{
    const chatWidget = document.querySelector('chat-widget');
    const ZoneValue = zoneinfo.filter((item) => {
      if(item.district.replace(/\s/g, "").toLowerCase()===message.replace(/\s/g, "").toLowerCase()){
        return item.zone
      }
    })
    if(ZoneValue.length===1){
      setTimeout(() => {
        chatWidget.responseMessage= message + ' is in ' + ZoneValue[0].zone + ' zone.';
      }, 1000)
      setTimeout(() => {
        chatWidget.responseMessage= 'Want to know for different city/district. Type city/district name below and i would be happy to assist. Thanks';
      }, 1000)
    } else{
      setTimeout(() => {
        chatWidget.responseMessage= 'No matching city found.Please type city name correctly.';
      }, 1000)
    }
  }

  return (
    <React.Fragment>
      <Header />
      <LoadingContext.Provider value={value}>
        {loading ? <Spinner /> : null}
        <div className="container flex-grow-1">
          <BrowserRouter>
            <Route path='/'>
              <div>
                <Switch>
                  <Route path="/coronatracker" exact
                    render={() => {
                      return (
                        <React.Fragment>
                          <chat-widget ref={handleEvent}
                          ></chat-widget>
                          {error ? <Error retryCallback={loadData} /> : null}
                          <Summary global={data.Global} lastUpdate={data.Date} />
                          <Countries countries={data.FilteredCountries} countryFilter={countryFilter} />
                        </React.Fragment>
                      );
                    }} />
                  <Route path="/:slug" component={Country} />
                </Switch>
              </div>
            </Route>
          </BrowserRouter>
        </div>
      </LoadingContext.Provider>
      <Footer />
    </React.Fragment>
  );
}

export default withRouter(App);
