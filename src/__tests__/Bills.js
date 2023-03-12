/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import store from "../__mocks__/store.js";
import userEvent from '@testing-library/user-event';
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {

  test("Then bill icon in vertical layout should be highlighted", async () => {

    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    })

    )


    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.Bills)
    await waitFor(() => screen.getByTestId('icon-window'))
    const windowIcon = screen.getByTestId('icon-window')
    expect(windowIcon).toBeTruthy()
    //to-do write expect expression

  })

  test('Then, Loading page should be rendered', () => {
    // DOM construction
    document.body.innerHTML = BillsUI({ loading: true });

    // expected result
    expect(screen.getAllByText('Loading...')).toBeTruthy();
  });


  test("Then bills should be ordered from earliest to latest", () => {
    document.body.innerHTML = BillsUI({ data: bills })
    const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
    const antiChrono = (a, b) => ((a < b) ? 1 : -1)
    const datesSorted = [...dates].sort(antiChrono)
    expect(dates).toEqual(datesSorted)
  })
})

// TEST : Error on BillsUI page
describe('When I am on Bills page and back-end send an error message', () => {
  test('Then, Error page should be rendered', () => {
    // DOM construction
    document.body.innerHTML = BillsUI({ error: 'some error message' });

    // expected result
    expect(screen.getAllByText('Erreur')).toBeTruthy();
  });
});


// TEST : bill icon visible in vertical layout
describe('When I am on Bills page', () => {
  test('Then bill icon in vertical layout should be visible', () => {
    // DOM construction
    document.body.innerHTML = BillsUI({ data: [] });

    // get DOM element
    const billIcon = screen.getByTestId('icon-window');

    // expected result
    expect(billIcon).toBeTruthy();
  });
});


// TEST : empty table if no bill
describe('When I am on Bills Page and there are no bill', () => {
  test('Then bills should render an empty table', () => {
    // DOM construction
    document.body.innerHTML = BillsUI({ data: [] });

    // get DOM element
    const eyeIcon = screen.queryByTestId('icon-eye');

    // expected result
    expect(eyeIcon).toBeNull();


  });
});





// TEST : click on icon eye opens modal & display attached image
describe('When I am on Bills page and I click on an icon eye', () => {
  test('Then a modal should open', () => {
    // DOM construction
    document.body.innerHTML = BillsUI({ data: bills });

    // init bills display
    const billsContainer = new Bills({
      document,
      onNavigate,
      firestore: null,
      localStorage: window.localStorage,
    });

    // get DOM element
    const iconEye = screen.getAllByTestId('icon-eye')[0];

    // handle click event
    const handleClickIconEye = jest.fn(
      billsContainer.handleClickIconEye(iconEye)
    );
    iconEye.addEventListener('click', handleClickIconEye);
    userEvent.click(iconEye);

    // expected result
    expect(handleClickIconEye).toHaveBeenCalled();


  });

  test('Then the modal should display the attached image', () => {
    // DOM construction
    document.body.innerHTML = BillsUI({ data: bills });

    // init bills display
    const billsContainer = new Bills({
      document,
      onNavigate,
      firestore: null,
      localStorage: window.localStorage,
    });

    // get DOM element
    const iconEye = screen.getAllByTestId('icon-eye')[0];

    // handle click event
    billsContainer.handleClickIconEye(iconEye);

    // expected results
    expect(document.querySelector('.modal')).toBeTruthy();
  });


});

// INTEGRATION GET TESTS

describe('Given I am a user connected as Employee', () => {
  describe('When I navigate to BillsUI', () => {
    // TEST : bills fetch from API
    test('fetches bills from mock API GET', async () => {
      // spy on Firebase Mock
      const getSpy = jest.spyOn(store, 'get');

      // get bills
      const bills = await store.get();

      // expected results
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });

    // TEST : bills fetch failure => 404 error
    test('fetches bills from an API and fails with 404 message error', async () => {
      // single use for throw error
      store.get.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 404'))
      );

      // DOM construction
      document.body.innerHTML = BillsUI({ error: 'Erreur 404' });

      // await response
      const message = await screen.getByText(/Erreur 404/);

      // expected result
      expect(message).toBeTruthy();
    });

    // TEST messages fetch failure => 500 error
    test('fetches messages from an API and fails with 500 message error', async () => {
      // single use for throw error
      store.get.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 500'))
      );

      // DOM construction
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' });

      // await for response
      const message = await screen.getByText(/Erreur 500/);

      // expected result
      expect(message).toBeTruthy();
    });
  });
});
