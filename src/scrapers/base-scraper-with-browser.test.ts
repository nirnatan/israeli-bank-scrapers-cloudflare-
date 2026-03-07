import { extendAsyncTimeout, getTestsConfig } from '../tests/tests-utils';
import { CompanyTypes } from '../definitions';
import { BaseScraperWithBrowser } from './base-scraper-with-browser';

const testsConfig = getTestsConfig();

function isNoSandbox(browser: any) {
  // eslint-disable-next-line no-underscore-dangle
  const args = browser._process.spawnargs;
  return args.includes('--no-sandbox');
}

describe('Base scraper with browser', () => {
  beforeAll(() => {
    extendAsyncTimeout(); // The default timeout is 5 seconds per async test, this function extends the timeout value
  });

  xtest('should pass custom args to scraper if provided', async () => {
    const options = {
      ...testsConfig.options,
      companyId: 'test',
      showBrowser: false,
      args: [],
    };

    // avoid false-positive result by confirming that --no-sandbox is not a default flag provided by puppeteer
    let baseScraperWithBrowser = new BaseScraperWithBrowser(options);
    try {
      await baseScraperWithBrowser.initialize();
      // @ts-ignore
      expect(baseScraperWithBrowser.browser).toBeDefined();
      // @ts-ignore
      expect(isNoSandbox(baseScraperWithBrowser.browser)).toBe(false);
      await baseScraperWithBrowser.terminate(true);
    } catch (e) {
      await baseScraperWithBrowser.terminate(false);
      throw e;
    }

    // set --no-sandbox flag and expect it to be passed by puppeteer.lunch to the new created browser instance
    options.args = ['--no-sandbox', '--disable-gpu', '--window-size=1920x1080'];
    baseScraperWithBrowser = new BaseScraperWithBrowser(options);
    try {
      await baseScraperWithBrowser.initialize();
      // @ts-ignore
      expect(baseScraperWithBrowser.browser).toBeDefined();
      // @ts-ignore
      expect(isNoSandbox(baseScraperWithBrowser.browser)).toBe(true);
      await baseScraperWithBrowser.terminate(true);
    } catch (e) {
      await baseScraperWithBrowser.terminate(false);
      throw e;
    }
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
