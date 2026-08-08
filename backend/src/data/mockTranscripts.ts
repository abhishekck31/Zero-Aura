/**
 * Seed corpus for the demo deck.
 *
 * IMPORTANT: these are SYNTHETIC, illustrative market events written for this
 * PoC. The figures are invented and do not reflect real filings, real earnings
 * calls, or real company performance. In production this array is replaced by a
 * live news/filings feed; the shape is what matters.
 */
export interface MockTranscript {
  ticker: string;
  companyName: string;
  rawText: string;
}

export const mockTranscripts: MockTranscript[] = [
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    rawText: `Q3 earnings call, prepared remarks. Data center revenue came in at $30.8 billion, up 94% year over year and ahead of our guidance of $28.5 billion. Blackwell has entered full production and demand substantially exceeds supply; we expect that to persist through the next four quarters. Gross margin was 75.1%, up 120 basis points sequentially. Gaming revenue was $3.3 billion, up 15% year over year. On the call, management noted that four of the largest hyperscalers now account for roughly 46% of data center revenue, and that lead times on advanced packaging capacity remain the primary constraint on shipments. Guidance for Q4 was set at $37.5 billion, above consensus of $37.1 billion.`,
  },
  {
    ticker: "TSLA",
    companyName: "Tesla, Inc.",
    rawText: `Quarterly update. Total deliveries were 462,890 vehicles, up 2.3% year over year but below the consensus estimate of 470,000. Automotive gross margin excluding regulatory credits fell to 15.4% from 17.1% a year ago, reflecting continued price reductions across the Model 3 and Model Y lineup. Energy storage deployments were a bright spot at 14.2 GWh, up 78% year over year and a company record. Free cash flow was $2.1 billion. Management reiterated that the affordable next-generation vehicle remains on track for production in the second half of next year, and stated that the robotaxi program is targeting a limited public deployment in two additional metro areas. Regulatory credit revenue declined 34% year over year to $580 million.`,
  },
  {
    ticker: "PLTR",
    companyName: "Palantir Technologies Inc.",
    rawText: `Q3 results. Total revenue was $726 million, up 30% year over year. US commercial revenue grew 54% year over year to $179 million, and US commercial customer count rose 77% to 321 customers. Government revenue was $408 million, up 33%. Adjusted operating margin reached 38%, up from 29% a year ago. The company closed 104 deals worth more than $1 million and 36 deals worth more than $5 million. Remaining performance obligations stood at $1.57 billion. Management raised full-year revenue guidance to a range of $2.80 to $2.81 billion. The company trades at approximately 55x forward sales. Net dollar retention was 118%.`,
  },
  {
    ticker: "COIN",
    companyName: "Coinbase Global, Inc.",
    rawText: `Shareholder letter. Total revenue was $1.45 billion, up 79% year over year. Transaction revenue was $1.05 billion, driven by a 62% increase in trading volume to $185 billion. Subscription and services revenue reached $556 million, up 66% year over year, with stablecoin revenue of $247 million. Adjusted EBITDA was $449 million. Monthly transacting users were 8.1 million. Management highlighted that institutional trading volume represented 68% of total volume. Operating expenses rose 24% sequentially to $1.1 billion, driven primarily by higher variable transaction costs and increased marketing spend. The company noted that revenue remains highly correlated to crypto asset volatility and price levels.`,
  },
  {
    ticker: "NFLX",
    companyName: "Netflix, Inc.",
    rawText: `Q4 letter to shareholders. Revenue grew 16% year over year to $10.2 billion. Operating margin was 22.2%, up from 16.9% a year ago. The ad-supported tier now accounts for over 40% of all new sign-ups in the twelve markets where it is available, and ad tier monthly active users reached 70 million. Average revenue per membership grew 1% year over year. The company announced a price increase across standard and premium plans in the US, Canada, and the UK. Management guided to full-year operating margin of 29% and stated that live event programming, including two additional NFL games, will expand next year. Free cash flow for the year was $6.9 billion. Content amortization is expected to rise as live sports commitments scale.`,
  },
  {
    ticker: "AAPL",
    companyName: "Apple Inc.",
    rawText: `Q1 earnings call. Total revenue was $124.3 billion, up 4% year over year and an all-time record. iPhone revenue was $69.1 billion, down 1% year over year, missing consensus of $71.0 billion. Services revenue reached an all-time high of $26.3 billion, up 14% year over year, with gross margin on Services at 75%. Greater China revenue declined 11% year over year to $18.5 billion. Total gross margin was 46.9%. The installed base of active devices surpassed 2.35 billion. Management noted that Apple Intelligence features have rolled out to additional languages and that markets with Apple Intelligence available saw stronger year-over-year iPhone performance than markets without it. The company returned $30 billion to shareholders during the quarter.`,
  },
  {
    ticker: "AMD",
    companyName: "Advanced Micro Devices, Inc.",
    rawText: `Q3 earnings call. Data center segment revenue was $3.55 billion, up 122% year over year, driven by MI300 accelerator shipments which surpassed $1.5 billion cumulative since launch. Client segment revenue grew 29% to $1.88 billion. Gaming segment revenue declined 69% year over year to $462 million on lower semi-custom console demand. Total gross margin was 50%, up 250 basis points year over year. Management raised full-year data center GPU revenue guidance to over $5 billion, from $4.5 billion previously. On the call, management acknowledged that supply of advanced packaging remains constrained into next year and that the company holds low single-digit share of the accelerator market against a competitor with over 80%. Embedded segment revenue fell 25% to $927 million.`,
  },
  {
    ticker: "MSFT",
    companyName: "Microsoft Corporation",
    rawText: `Q2 earnings call. Total revenue was $69.6 billion, up 12% year over year. Microsoft Cloud revenue reached $40.9 billion, up 21%. Azure and other cloud services grew 31%, of which management attributed roughly 13 points to AI services. Capital expenditure for the quarter was $22.6 billion, up 95% year over year, and management guided to continued elevated spend. Operating margin was 45%, down 1 point year over year on higher depreciation from datacenter buildout. More Personal Computing revenue was flat at $14.7 billion. Management stated that Azure AI capacity remains supply constrained and that they expect to remain capacity constrained through at least the first half of next fiscal year. Commercial bookings grew 67%.`,
  },
  {
    ticker: "GOOGL",
    companyName: "Alphabet Inc.",
    rawText: `Q3 earnings call. Total revenue was $88.3 billion, up 15% year over year. Google Cloud revenue was $11.4 billion, up 35%, with operating margin of 17% versus 3% a year ago. Search and other revenue grew 12% to $49.4 billion. YouTube ads revenue was $8.9 billion, up 12%. Total operating margin reached 32%, up from 28%. Management said AI Overviews are now available in more than 100 countries and that monetization of AI Overviews is approximately at the same rate as traditional search. Capital expenditure was $13.1 billion for the quarter. The company continues to face an adverse ruling in the US search antitrust case, with remedies still to be determined, and management declined to quantify potential impact.`,
  },
  {
    ticker: "META",
    companyName: "Meta Platforms, Inc.",
    rawText: `Q3 earnings call. Revenue was $40.6 billion, up 19% year over year. Family daily active people reached 3.29 billion, up 5%. Ad impressions grew 7% and average price per ad increased 11%. Operating margin was 43%, up from 40% a year ago. Reality Labs posted an operating loss of $4.4 billion for the quarter, bringing cumulative losses since 2020 above $58 billion, and management guided that Reality Labs operating losses will increase meaningfully again next year. Total expenses are guided to $96 to $98 billion for the full year. Capital expenditure guidance was raised to $38 to $40 billion. Management noted that AI recommendation improvements drove an 8% increase in time spent on Facebook.`,
  },
  {
    ticker: "AMZN",
    companyName: "Amazon.com, Inc.",
    rawText: `Q3 earnings call. Net sales were $158.9 billion, up 11% year over year. AWS revenue was $27.5 billion, up 19%, with AWS operating income of $10.4 billion and operating margin of 38%, up from 30% a year ago. North America segment operating margin reached 5.9%, up from 4.9%. Advertising services revenue grew 19% to $14.3 billion. Free cash flow for the trailing twelve months was $47.7 billion. Capital expenditure is guided to approximately $75 billion for the full year, primarily for AWS AI infrastructure. International segment operating margin was 3.6%. Management noted that AWS growth remains constrained by power and chip availability, and that the cost to serve per unit declined for the eighth consecutive quarter.`,
  },
  {
    ticker: "UBER",
    companyName: "Uber Technologies, Inc.",
    rawText: `Q3 earnings call. Gross bookings were $41.0 billion, up 16% year over year. Mobility gross bookings grew 17% and Delivery grew 16%. Adjusted EBITDA was $1.69 billion, up 55% year over year, with margin of 4.1% of gross bookings versus 3.1% a year ago. Free cash flow was $2.1 billion for the quarter. Monthly active platform consumers reached 161 million, up 13%. Trips grew 17%. Management flagged that insurance costs in the US continue to rise at a rate above overall inflation and remain the single largest cost headwind. Uber One membership surpassed 25 million members. Management also noted increased regulatory scrutiny of driver classification in several international markets.`,
  },
  {
    ticker: "ABNB",
    companyName: "Airbnb, Inc.",
    rawText: `Q3 shareholder letter. Revenue was $3.73 billion, up 10% year over year. Nights and experiences booked grew 8% to 123 million. Gross booking value was $20.1 billion, up 10%. Net income was $1.37 billion, representing a 37% net margin, though this included a one-time tax benefit. Free cash flow for the trailing twelve months was $4.1 billion, a 40% margin. Average daily rate rose 1% to $164. Management noted that growth in North America, its largest market, decelerated to 3%, while Latin America and Asia Pacific grew in the high teens. The company is investing over $200 million next year into expanding beyond core homes business, which will pressure near-term margins. Regulatory restrictions on short-term rentals expanded in several European cities.`,
  },
  {
    ticker: "DIS",
    companyName: "The Walt Disney Company",
    rawText: `Q4 earnings call. Total revenue was $22.6 billion, up 6% year over year. Entertainment direct-to-consumer posted operating income of $253 million, compared with a loss of $387 million a year ago, marking the second consecutive profitable quarter. Disney+ core subscribers reached 122.7 million, up 4.4 million sequentially. Experiences segment operating income declined 6% to $1.66 billion, with domestic parks margin pressured by higher costs and hurricane-related closures estimated at $130 million. Linear networks revenue fell 6% and operating income fell 38%. Management guided to double-digit segment operating income growth for the full year and announced $3 billion in share repurchases. ESPN's direct-to-consumer flagship service is slated to launch, with management declining to guide on its subscriber ramp.`,
  },
  {
    ticker: "CRWD",
    companyName: "CrowdStrike Holdings, Inc.",
    rawText: `Q3 earnings call. Total revenue was $1.01 billion, up 29% year over year. Annual recurring revenue reached $4.02 billion, up 27%, with net new ARR of $153 million, down 15% year over year. Subscription gross margin was 80%. Free cash flow was $231 million, a 23% margin. Customers adopting five or more modules reached 66%. Management noted that customer commitment packages offered following the July incident continued to weigh on net new ARR and are expected to pressure results through the first half of next year. Gross retention was 97%, roughly flat. The company faces ongoing litigation related to the incident, and management stated it is not able to estimate potential losses at this time. Remaining performance obligations grew 41%.`,
  },
];
