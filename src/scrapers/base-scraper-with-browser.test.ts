import { extendAsyncTimeout } from '../tests/tests-utils';
import { CompanyTypes } from '../definitions';
import { type ScraperOptions } from './interface';
import { BaseScraperWithBrowser } from './base-scraper-with-browser';

describe('Base scraper with browser', () => {
  beforeAll(() => {
    extendAsyncTimeout(); // The default timeout is 5 seconds per async test, this function extends the timeout value
  });

  test('should fail initialization when browser launcher is missing', async () => {
    const invalidOptions = {
      companyId: CompanyTypes.leumi,
      startDate: new Date('2020-05-01'),
    } as unknown as ScraperOptions;
    const scraper = new BaseScraperWithBrowser(invalidOptions);

    await expect(scraper.initialize()).rejects.toThrow(
      'Missing browser initialization option: provide browserContext, browser, or launchBrowser',
    );
  });

  test('should use custom launchBrowser option when provided', async () => {
    const page = {
      setCacheEnabled: jest.fn(),
      setDefaultTimeout: jest.fn(),
      setViewport: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
      screenshot: jest.fn(),
    };
    const browser = {
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn(),
    };
    const launchBrowser = jest.fn().mockResolvedValue(browser);
    const prepareBrowser = jest.fn();
    const scraper = new BaseScraperWithBrowser({
      companyId: CompanyTypes.leumi,
      startDate: new Date('2020-05-01'),
      launchBrowser,
      prepareBrowser,
    });

    await scraper.initialize();

    expect(launchBrowser).toHaveBeenCalledTimes(1);
    expect(prepareBrowser).toHaveBeenCalledWith(browser);
    expect(browser.newPage).toHaveBeenCalledTimes(1);
    expect(page.setViewport).toHaveBeenCalledWith({ width: 1024, height: 768 });

    await scraper.terminate(true);

    expect(page.close).toHaveBeenCalledTimes(1);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});
