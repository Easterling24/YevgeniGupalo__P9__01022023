/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from '@testing-library/dom';
import BillsUI from '../views/BillsUI.js';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import '@testing-library/jest-dom';
import { localStorageMock } from '../__mocks__/localStorage';
import store from '../app/Store';
import mockStore from '../__mocks__/store';
import { ROUTES } from '../constants/routes';

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};


describe('Given I am connected as an employee', () => {
  // parcours employe
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  window.localStorage.setItem(
    'user',
    JSON.stringify({
      type: 'Employee',
    })
  );

  describe('When I am on NewBill Page', () => {
    // TEST : display newBill page
    test('Then the newBill page should be rendered', () => {
      // DOM construction
      document.body.innerHTML = NewBillUI();

      // expected result
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
    });

    // TEST : display 9 fields
    test('Then a form with nine fields should be rendered', () => {
      // DOM construction
      document.body.innerHTML = NewBillUI();

      // get DOM element
      const form = document.querySelector('form');

      // expected result
      expect(form.length).toEqual(9);
    });
  });

  describe('When I am on NewBill Page and I add an attached file', () => {
    // TEST : handle attached file format
    test('Then the file handler should be run', () => {
      // DOM construction
      document.body.innerHTML = NewBillUI();

      // get DOM element
      const newBill = new NewBill({
        document,
        onNavigate,
        store: store,
        localStorage: window.localStorage,
      });

      // handle event
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const attachedFile = screen.getByTestId('file');
      attachedFile.addEventListener('change', handleChangeFile);
      fireEvent.change(attachedFile, {
        target: {
          files: [new File(['file.txt'], 'file.txt', { type: 'text/txt' })],
        },
      });

      // expected result
      const numberOfFile = screen.getByTestId('file').files.length;
      expect(numberOfFile).toEqual(1);
    });
  });

  describe('WHEN I am on NewBill page and I submit a correct form', () => {
    // TEST : submit correct form and attached file
    test('THEN I should be redirected to Bills page', () => {
      // DOM construction
      document.body.innerHTML = NewBillUI();

      // get DOM element
      const newBillContainer = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      // handle event submit attached file
      const handleSubmit = jest.fn(newBillContainer.handleSubmit);
      newBillContainer.fileName = 'image.jpg';

      // handle event submit form
      const newBillForm = screen.getByTestId('form-new-bill');
      newBillForm.addEventListener('submit', handleSubmit);
      fireEvent.submit(newBillForm);

      // expected results
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy();
    });
  });

  describe('When I am on NewBill page and I submit a wrong attached file format', () => {
    // TEST : wrong attached file format
    test('Then the error message should be displayed', () => {});

    // DOM construction
    document.body.innerHTML = NewBillUI();

    // get DOM element
    const newBillContainer = new NewBill({
      document,
      onNavigate,
      firestore: null,
      localStorage: window.localStorage,
    });

    const handleChangeFile = jest.fn(newBillContainer.handleChangeFile);

    const attachedFile = screen.getByTestId('file');
    attachedFile.addEventListener('change', handleChangeFile);
    fireEvent.change(attachedFile, {
      target: {
        files: [
          new File(['document.pdf'], 'document.pdf', {
            type: 'application/pdf',
          }),
        ],
      },
    });

    // expected results
    expect(handleChangeFile).toHaveBeenCalled();
    expect(attachedFile.files[0].name).toBe('document.pdf');

    // get DOM element
    const errorMessage = screen.getByTestId('fileFormat-errorMessage');

    // expected results
    expect(errorMessage.textContent).toEqual(
      expect.stringContaining(
        'Votre justificatif doit être une image de format (.jpg) ou (.jpeg) ou (.png)'
      )
    );
  });
});

// Test d'integration POST

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page and submit the form', () => {
    test('Then it should generate a new bill', async () => {
      // spy
      // Cannot spy the post property because it is not a function
      // undefined given instead
      const postSpy = jest.spyOn(mockStore, 'post');

      // new bill to submit
      const newBill = {
        id: '47qAXb6fIm2zOKkLzMro',
        vat: '80',
        fileUrl:
          'https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
        status: 'pending',
        type: 'Hôtel et logement',
        commentary: 'séminaire billed',
        name: 'fake new bill',
        fileName: 'preview-facture-free-201801-pdf-1.jpg',
        date: '2004-04-04',
        frenchDate: '04-04-2004',
        amount: 400,
        commentAdmin: 'ok',
        email: 'a@a',
        pct: 20,
      };

      // get bills and the new bill
      const bills = await mockStore.post(newBill);

      // expected results
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(bills).toBe('fake new bill received');
    });

    // TEST : newBill fetch failure => 404 error
    test('Then the bill is added to the API but fails with 404 message error', async () => {
      // single use for throw error
      // Cannot read property 'mockImplementationOnce' of undefined
      mockStore.post.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 404'))
      );

      // DOM construction
      document.body.innerHTML = BillsUI({ error: 'Erreur 404' });

      // await for response
      const message = screen.getByText(/Erreur 404/);

      // expected result
      expect(message).toBeTruthy();
    });

    test('then it posts to API and fails with 500 message error on Bills page', async () => {
      // cannot read property 'mockImplementationOnce' of undefined
      mockStore.post.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 500'))
      );

      // DOM construction
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' });

      // await for response
      const message = screen.getByText(/Erreur 500/);

      // expected result
      expect(message).toBeTruthy();
    });
  });
});