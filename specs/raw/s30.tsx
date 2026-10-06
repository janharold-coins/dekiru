const imgCountries = "https://www.figma.com/api/mcp/asset/ab564bb9-dd82-4835-98b3-99a89fcbe4d4.png";
const imgCountries1 = "https://www.figma.com/api/mcp/asset/5d9d327f-4ac7-43ec-8832-445d8ac926af.png";
const imgCountries2 = "https://www.figma.com/api/mcp/asset/f2717274-a889-457d-90bb-af1dcdf06e87.png";
const imgCountries3 = "https://www.figma.com/api/mcp/asset/70bdba52-e6a9-494f-93a4-55ab6cd462e2.png";
const imgCountries4 = "https://www.figma.com/api/mcp/asset/c831c6c3-778b-469c-b8fb-abf2ef0f9456.png";
const imgCountries5 = "https://www.figma.com/api/mcp/asset/4bc937fe-9f70-480d-9342-6a5a42efb54c.png";
const imgCountries6 = "https://www.figma.com/api/mcp/asset/2ef263d1-0b0b-4d07-848c-ddc2c7e34ece.png";
const imgCountries7 = "https://www.figma.com/api/mcp/asset/425e3f52-5d25-4228-8e57-fc7242202394.png";
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/c40fa682-19d5-48ca-860c-b51b8cc594aa.svg";

function AccentColor({ className }: { className?: string }) {
  return (
    <div className={className || "h-[11px] relative w-[1920px]"} data-node-id="511:26109" data-name="Accent color">
      <div className="absolute bg-[var(--core\/blue,#1f7aff)] inset-0" data-node-id="510:26092" />
      <div className="absolute bg-[var(--base\/blue\/blue-800,#204680)] inset-[0_1.25%_0_24.17%]" data-node-id="511:26110" />
      <div className="absolute bg-[var(--base\/orange\/orange-500,#fa7312)] inset-[0_4.43%_0_45.16%]" data-node-id="510:26091" />
    </div>
  );
}

function Frame46({ className }: { className?: string }) {
  return (
    <div className={className || "bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] w-[200px]"} data-node-id="410:14471">
      <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="410:14464">
        Collections
      </p>
      <div className="bg-[#f61414] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="410:14461">
        <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="410:14462">
          LIVE
        </p>
      </div>
    </div>
  );
}

function CountryCard({ className }: { className?: string }) {
  return (
    <div className={className || "border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] w-[260px]"} data-node-id="410:14490" style={{ backgroundImage: "linear-gradient(155.47987891830883deg, rgb(255, 255, 255) 13.016%, rgb(238, 238, 238) 105.99%)" }} data-name="Country Card">
      <div className="drop-shadow-[0px_0px_6px_rgba(0,0,0,0.25)] relative shrink-0 size-[65px]" data-node-id="410:14430" data-name="Countries">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCountries} />
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-black w-full" data-node-id="410:14456">
        <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[28px] text-center tracking-[-0.84px] w-full" data-node-id="410:14431">
          Philippines
        </p>
        <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full whitespace-nowrap" data-node-id="410:14455">
          <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[16px] tracking-[-0.48px]" data-node-id="410:14432">
            InstaPay / PESONet
          </p>
          <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[12px] tracking-[-0.36px]" data-node-id="410:14433">
            Real-time / Batch
          </p>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-node-id="410:14476">
        <Frame46 className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-full" />
        <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-[200px]" data-node-id="410:14472">
          <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I410:14472;410:14464">
            Disbursements
          </p>
          <div className="bg-[#f61414] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I410:14472;410:14461">
            <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I410:14472;410:14462">
              LIVE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StrictlyPrivateAndConfidential({ className }: { className?: string }) {
  return (
    <div className={className || "h-[33px] relative w-[426px]"} data-node-id="394:11816" data-name="Strictly Private And Confidential">
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-0 leading-[normal] not-italic text-[24px] text-black tracking-[2.4px] whitespace-nowrap" data-node-id="394:11693">
        Strictly Private And Confidential
      </p>
    </div>
  );
}

export default function Component30() {
  return (
    <div className="relative size-full" data-node-id="511:30387" style={{ backgroundImage: "linear-gradient(139.0856182740788deg, rgb(240, 240, 240) 30.321%, rgb(238, 240, 238) 87.755%)" }} data-name="30">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[52.341px] left-[calc(50%-769.78px)] top-[calc(50%-388.83px)] w-[222.45px]" data-node-id="511:30389" data-name="Icon/Logo">
        <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:30389;738:2734">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute content-stretch flex items-start left-[calc(50%-669.5px)] top-[323px]" data-node-id="511:30390">
        <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[48px] text-black tracking-[-1.44px] whitespace-nowrap" data-node-id="511:30391">
          Corridor Readiness
        </p>
      </div>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] leading-[1.4] left-[79px] not-italic text-[48px] text-black top-[398px] tracking-[-1.44px] w-[439px]" data-node-id="511:30392">
        Where we are live. Where we are next.
      </p>
      <StrictlyPrivateAndConfidential className="absolute h-[33px] left-[79px] top-[938px] w-[426px]" />
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Bold'] leading-[1.15] left-[1550px] not-italic text-[#757575] text-[28px] top-[145px] tracking-[-0.84px] whitespace-nowrap" data-node-id="511:30394">
        Products and Pricing
      </p>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Medium'] leading-[1.6] left-[calc(50%-881px)] not-italic text-[#363636] text-[28px] top-[592px] tracking-[-0.42px] w-[426px]" data-node-id="511:30395">{`Asia Pacific, Middle East, Europe, and the Americas. Philippines is live today, with seven more corridors rolling through 2026, each plugged straight into the country's national payment rail.`}</p>
      <div className="absolute content-center drop-shadow-[0px_0px_6px_rgba(0,0,0,0.08)] flex flex-wrap gap-[24px] items-center left-[719px] top-[266px] w-[1112px]" data-node-id="511:30396">
        <CountryCard className="border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] shrink-0 w-[260px]" />
        <div className="border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] shrink-0 w-[260px]" data-node-id="511:30398" style={{ backgroundImage: "linear-gradient(155.47987891830883deg, rgb(255, 255, 255) 13.016%, rgb(238, 238, 238) 105.99%)" }} data-name="Country Card">
          <div className="drop-shadow-[0px_0px_6px_rgba(0,0,0,0.25)] relative shrink-0 size-[65px]" data-node-id="I511:30398;410:14430" data-name="Countries">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCountries1} />
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-black w-full" data-node-id="I511:30398;410:14456">
            <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[28px] text-center tracking-[-0.84px] w-full" data-node-id="I511:30398;410:14431">
              Thailand
            </p>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full whitespace-nowrap" data-node-id="I511:30398;410:14455">
              <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[16px] tracking-[-0.48px]" data-node-id="I511:30398;410:14432">
                PromptPay
              </p>
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[12px] tracking-[-0.36px]" data-node-id="I511:30398;410:14433">
                Real-time
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-node-id="I511:30398;410:14476">
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-full" data-node-id="I511:30398;410:14489">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30398;410:14489;410:14464">
                Collections
              </p>
              <div className="bg-[#1449f6] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30398;410:14489;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30398;410:14489;410:14462">
                  2026Q3
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-[200px]" data-node-id="I511:30398;410:14472">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30398;410:14472;410:14464">
                Disbursements
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30398;410:14472;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30398;410:14472;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] shrink-0 w-[260px]" data-node-id="511:30399" style={{ backgroundImage: "linear-gradient(155.47987891830883deg, rgb(255, 255, 255) 13.016%, rgb(238, 238, 238) 105.99%)" }} data-name="Country Card">
          <div className="drop-shadow-[0px_0px_6px_rgba(0,0,0,0.25)] relative shrink-0 size-[65px]" data-node-id="I511:30399;410:14430" data-name="Countries">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCountries2} />
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-black w-full" data-node-id="I511:30399;410:14456">
            <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[28px] text-center tracking-[-0.84px] w-full" data-node-id="I511:30399;410:14431">
              Singapore
            </p>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full whitespace-nowrap" data-node-id="I511:30399;410:14455">
              <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[16px] tracking-[-0.48px]" data-node-id="I511:30399;410:14432">
                FAST
              </p>
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[12px] tracking-[-0.36px]" data-node-id="I511:30399;410:14433">
                Real-time
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-node-id="I511:30399;410:14476">
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-full" data-node-id="I511:30399;410:14489">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30399;410:14489;410:14464">
                Collections
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30399;410:14489;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30399;410:14489;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-[200px]" data-node-id="I511:30399;410:14472">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30399;410:14472;410:14464">
                Disbursements
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30399;410:14472;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30399;410:14472;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] shrink-0 w-[260px]" data-node-id="511:30400" style={{ backgroundImage: "linear-gradient(155.47987891830883deg, rgb(255, 255, 255) 13.016%, rgb(238, 238, 238) 105.99%)" }} data-name="Country Card">
          <div className="drop-shadow-[0px_0px_6px_rgba(0,0,0,0.25)] relative shrink-0 size-[65px]" data-node-id="I511:30400;410:14430" data-name="Countries">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCountries3} />
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-black w-full" data-node-id="I511:30400;410:14456">
            <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[28px] text-center tracking-[-0.84px] w-full" data-node-id="I511:30400;410:14431">
              Hong Kong
            </p>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full whitespace-nowrap" data-node-id="I511:30400;410:14455">
              <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[16px] tracking-[-0.48px]" data-node-id="I511:30400;410:14432">
                FPS
              </p>
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[12px] tracking-[-0.36px]" data-node-id="I511:30400;410:14433">
                Real-time
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-node-id="I511:30400;410:14476">
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-full" data-node-id="I511:30400;410:14489">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30400;410:14489;410:14464">
                Collections
              </p>
              <div className="bg-[#1449f6] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30400;410:14489;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30400;410:14489;410:14462">
                  2026Q3
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-[200px]" data-node-id="I511:30400;410:14472">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30400;410:14472;410:14464">
                Disbursements
              </p>
              <div className="bg-[#1449f6] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30400;410:14472;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30400;410:14472;410:14462">
                  2026Q3
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] shrink-0 w-[260px]" data-node-id="511:30401" style={{ backgroundImage: "linear-gradient(155.47987891830883deg, rgb(255, 255, 255) 13.016%, rgb(238, 238, 238) 105.99%)" }} data-name="Country Card">
          <div className="drop-shadow-[0px_0px_6px_rgba(0,0,0,0.25)] relative shrink-0 size-[65px]" data-node-id="I511:30401;410:14430" data-name="Countries">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCountries4} />
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-black w-full" data-node-id="I511:30401;410:14456">
            <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[28px] text-center tracking-[-0.84px] w-full" data-node-id="I511:30401;410:14431">
              UAE
            </p>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full whitespace-nowrap" data-node-id="I511:30401;410:14455">
              <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[16px] tracking-[-0.48px]" data-node-id="I511:30401;410:14432">
                IPI / UAEFTS
              </p>
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[12px] tracking-[-0.36px]" data-node-id="I511:30401;410:14433">
                Real-time / Banking hours
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-node-id="I511:30401;410:14476">
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-full" data-node-id="I511:30401;410:14489">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30401;410:14489;410:14464">
                Collections
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30401;410:14489;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30401;410:14489;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-[200px]" data-node-id="I511:30401;410:14472">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30401;410:14472;410:14464">
                Disbursements
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30401;410:14472;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30401;410:14472;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] shrink-0 w-[260px]" data-node-id="511:30402" style={{ backgroundImage: "linear-gradient(155.47987891830883deg, rgb(255, 255, 255) 13.016%, rgb(238, 238, 238) 105.99%)" }} data-name="Country Card">
          <div className="drop-shadow-[0px_0px_6px_rgba(0,0,0,0.25)] relative shrink-0 size-[65px]" data-node-id="I511:30402;410:14430" data-name="Countries">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCountries5} />
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-black w-full" data-node-id="I511:30402;410:14456">
            <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[28px] text-center tracking-[-0.84px] w-full" data-node-id="I511:30402;410:14431">
              Europe
            </p>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full whitespace-nowrap" data-node-id="I511:30402;410:14455">
              <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[16px] tracking-[-0.48px]" data-node-id="I511:30402;410:14432">
                SEPA Instant / Standard SEPA
              </p>
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[12px] tracking-[-0.36px]" data-node-id="I511:30402;410:14433">
                Real-time / Batch
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-node-id="I511:30402;410:14476">
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-full" data-node-id="I511:30402;410:14489">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30402;410:14489;410:14464">
                Collections
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30402;410:14489;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30402;410:14489;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-[200px]" data-node-id="I511:30402;410:14472">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30402;410:14472;410:14464">
                Disbursements
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30402;410:14472;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30402;410:14472;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] shrink-0 w-[260px]" data-node-id="511:30403" style={{ backgroundImage: "linear-gradient(155.47987891830883deg, rgb(255, 255, 255) 13.016%, rgb(238, 238, 238) 105.99%)" }} data-name="Country Card">
          <div className="drop-shadow-[0px_0px_6px_rgba(0,0,0,0.25)] relative shrink-0 size-[65px]" data-node-id="I511:30403;410:14430" data-name="Countries">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCountries6} />
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-black w-full" data-node-id="I511:30403;410:14456">
            <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[28px] text-center tracking-[-0.84px] w-full" data-node-id="I511:30403;410:14431">
              Brazil
            </p>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full whitespace-nowrap" data-node-id="I511:30403;410:14455">
              <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[16px] tracking-[-0.48px]" data-node-id="I511:30403;410:14432">
                PIX
              </p>
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[12px] tracking-[-0.36px]" data-node-id="I511:30403;410:14433">
                Real-time
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-node-id="I511:30403;410:14476">
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-full" data-node-id="I511:30403;410:14489">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30403;410:14489;410:14464">
                Collections
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30403;410:14489;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30403;410:14489;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-[200px]" data-node-id="I511:30403;410:14472">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30403;410:14472;410:14464">
                Disbursements
              </p>
              <div className="bg-[#f77b15] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30403;410:14472;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30403;410:14472;410:14462">
                  2026Q2
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-[#dbdbdb] border-solid content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-[12px] shrink-0 w-[260px]" data-node-id="511:30404" style={{ backgroundImage: "linear-gradient(155.47987891830883deg, rgb(255, 255, 255) 13.016%, rgb(238, 238, 238) 105.99%)" }} data-name="Country Card">
          <div className="drop-shadow-[0px_0px_6px_rgba(0,0,0,0.25)] relative shrink-0 size-[65px]" data-node-id="I511:30404;410:14430" data-name="Countries">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCountries7} />
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-black w-full" data-node-id="I511:30404;410:14456">
            <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[28px] text-center tracking-[-0.84px] w-full" data-node-id="I511:30404;410:14431">
              Australia
            </p>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full whitespace-nowrap" data-node-id="I511:30404;410:14455">
              <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[16px] tracking-[-0.48px]" data-node-id="I511:30404;410:14432">
                NPP (PayID)
              </p>
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[12px] tracking-[-0.36px]" data-node-id="I511:30404;410:14433">{`Real-time `}</p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-node-id="I511:30404;410:14476">
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-full" data-node-id="I511:30404;410:14489">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30404;410:14489;410:14464">
                Collections
              </p>
              <div className="bg-[#1449f6] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30404;410:14489;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30404;410:14489;410:14462">
                  2026Q3
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#ececec] border-solid content-stretch flex items-center justify-between opacity-80 px-[12px] py-[8px] relative rounded-[4px] shrink-0 w-[200px]" data-node-id="I511:30404;410:14472">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[10px] text-black tracking-[0.1px] uppercase whitespace-nowrap" data-node-id="I511:30404;410:14472;410:14464">
                Disbursements
              </p>
              <div className="bg-[#1449f6] content-stretch flex items-center justify-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-node-id="I511:30404;410:14472;410:14461">
                <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[12px] text-white tracking-[0.72px] whitespace-nowrap" data-node-id="I511:30404;410:14472;410:14462">
                  2026Q3
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AccentColor className="absolute h-[11px] left-0 top-[1069px] w-[1920px]" />
    </div>
  );
}