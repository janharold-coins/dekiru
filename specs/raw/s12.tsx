// get_design_context reference code — Figma PhmKTV0Z0gwAKs8MNxEgcI node 511:29617 (slide 12, product-detail)
// Saved verbatim. Asset URLs are temporary (7 days); local copies in public/figma/shared-product/.
//   imgLine8 -> /figma/shared-product/section-dash-line.svg
//   imgGroup54416 -> logo (shared chrome, handled elsewhere)
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/d0549e05-296b-4dd5-ba96-cbdd4aa45cff.svg";
const imgLine8 = "https://www.figma.com/api/mcp/asset/39e56d65-97b7-4a8a-b7eb-adf9f2bb3c25.svg";

function AccentColor({ className }: { className?: string }) {
  return (
    <div className={className || "h-[11px] relative w-[1920px]"} data-node-id="511:26109" data-name="Accent color">
      <div className="absolute bg-[var(--core\/blue,#1f7aff)] inset-0" data-node-id="510:26092" />
      <div className="absolute bg-[var(--base\/blue\/blue-800,#204680)] inset-[0_1.25%_0_24.17%]" data-node-id="511:26110" />
      <div className="absolute bg-[var(--base\/orange\/orange-500,#fa7312)] inset-[0_4.43%_0_45.16%]" data-node-id="510:26091" />
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

export default function Component12() {
  return (
    <div className="relative size-full" data-node-id="511:29617" data-name="12">
      <div className="absolute h-[1080px] left-0 overflow-clip top-0 w-[1920px]" data-node-id="511:29618" style={{ backgroundImage: "linear-gradient(139.0856182740788deg, rgb(240, 240, 240) 30.321%, rgb(238, 240, 238) 87.755%)" }} data-name="11">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[52.341px] left-[calc(50%-769.78px)] top-[calc(50%-388.83px)] w-[222.45px]" data-node-id="511:29619" data-name="Icon/Logo">
          <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:29619;738:2734">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
          </div>
        </div>
        <StrictlyPrivateAndConfidential className="absolute h-[33px] left-[1417px] top-[74px] w-[426px]" />
        <div className="absolute content-stretch flex gap-[60px] items-start left-[903px] top-[336px] w-[940px]" data-node-id="511:29621">
          <div className="content-stretch flex flex-col gap-[24px] items-start py-[36px] relative shrink-0 w-[420px]" data-node-id="511:29622">
            <div className="content-stretch flex gap-[36px] items-center pl-[24px] relative shrink-0 w-full" data-node-id="511:29623">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[36px] text-black tracking-[-1.08px] whitespace-nowrap" data-node-id="511:29624">
                What it is
              </p>
              <div className="h-0 relative shrink-0 w-[48px]" data-node-id="511:29625">
                <div className="absolute inset-[-4px_0_0_0]">
                  <img alt="" className="block max-w-none size-full" src={imgLine8} />
                </div>
              </div>
            </div>
            <ul className="[word-break:break-word] block font-['Cns_Manrope:Regular'] leading-[0] list-disc not-italic relative shrink-0 text-[24px] text-black tracking-[-0.72px] w-[420px]" data-node-id="511:29626">
              <li className="mb-[12px] ms-[36px]">
                <span className="leading-[1.6]">
                  Hosted and API based checkout
                  <br aria-hidden />
                  for web and app.
                </span>
              </li>
              <li className="mb-[12px] ms-[36px]">
                <span className="leading-[1.6]">In-store QR codes, plus credit card acceptance through POS terminals.</span>
              </li>
              <li className="ms-[36px]">
                <span className="leading-[1.6]">Checkout in PHP, USDT, USDC, BTC, ETH. One-tap repeat buying via WebPay.</span>
              </li>
            </ul>
          </div>
          <div className="border border-black border-solid content-stretch flex flex-col gap-[24px] items-start px-[24px] py-[36px] relative rounded-[12px] shrink-0 w-[460px]" data-node-id="511:29627">
            <div className="content-stretch flex gap-[36px] items-center pl-[24px] relative shrink-0 w-full" data-node-id="511:29628">
              <p className="[word-break:break-word] font-['Cns_Manrope:Bold'] leading-[1.4] not-italic relative shrink-0 text-[36px] text-black tracking-[-1.08px] whitespace-nowrap" data-node-id="511:29629">
                Key APIs
              </p>
              <div className="h-0 relative shrink-0 w-[48px]" data-node-id="511:29630">
                <div className="absolute inset-[-4px_0_0_0]">
                  <img alt="" className="block max-w-none size-full" src={imgLine8} />
                </div>
              </div>
            </div>
            <ul className="[word-break:break-word] block font-['Cns_Manrope:Regular'] leading-[0] list-disc not-italic relative shrink-0 text-[24px] text-black tracking-[-0.72px] w-full" data-node-id="511:29631">
              <li className="mb-[12px] ms-[36px] whitespace-pre-wrap">
                <span className="leading-[1.6]">
                  {`Create Checkout, `}
                  <br aria-hidden />
                  Status Check, Webhook Notify.
                </span>
              </li>
              <li className="mb-[12px] ms-[36px] whitespace-pre-wrap">
                <span className="leading-[1.6]">
                  {`Tokenized Payments `}
                  <br aria-hidden />
                  for one-tap repeat.
                </span>
              </li>
              <li className="mb-[12px] ms-[36px]">
                <span className="leading-[1.6]">Static or Dynamic QR codes.</span>
              </li>
              <li className="ms-[36px]">
                <span className="leading-[1.6]">Multi-Asset Payment.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="[word-break:break-word] absolute bottom-[92px] content-stretch flex gap-[36px] items-center justify-end leading-[1.4] not-italic right-[77px] text-black whitespace-nowrap" data-node-id="511:29632">
          <p className="font-['Cns_Manrope:Bold'] relative shrink-0 text-[36px] tracking-[1.08px]" data-node-id="511:29633">
            PRICING
          </p>
          <div className="content-stretch flex gap-[24px] items-center relative shrink-0 text-center" data-node-id="511:29634">
            <div className="bg-white border-2 border-[#bcbcbc] border-solid content-stretch flex flex-col items-center justify-center p-[24px] relative rounded-[8px] shrink-0" data-node-id="511:29635">
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[24px] tracking-[-0.72px]" data-node-id="I511:29635;407:13285">
                QRPh
              </p>
              <div className="content-stretch flex font-['TWK_Everett:Bold'] items-center justify-center relative shrink-0" data-node-id="I511:29635;407:13290">
                <p className="relative shrink-0 text-[40px]" data-node-id="I511:29635;407:13286">
                  1.2
                </p>
                <p className="relative shrink-0 text-[20px] tracking-[-0.6px]" data-node-id="I511:29635;407:13288">
                  %
                </p>
              </div>
            </div>
            <div className="bg-white border-2 border-[#bcbcbc] border-solid content-stretch flex flex-col items-center p-[24px] relative rounded-[8px] shrink-0" data-node-id="511:29636">
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[24px] tracking-[-0.72px]" data-node-id="I511:29636;407:13285">
                WebPay
              </p>
              <div className="content-stretch flex font-['TWK_Everett:Bold'] items-center justify-center relative shrink-0" data-node-id="I511:29636;407:13290">
                <p className="relative shrink-0 text-[40px]" data-node-id="I511:29636;407:13286">
                  1.0
                </p>
                <p className="relative shrink-0 text-[20px] tracking-[-0.6px]" data-node-id="I511:29636;407:13288">
                  %
                </p>
              </div>
            </div>
            <div className="bg-white border-2 border-[#bcbcbc] border-solid content-stretch flex flex-col items-center p-[24px] relative rounded-[8px] shrink-0" data-node-id="511:29637">
              <p className="font-['Cns_Manrope:Regular'] relative shrink-0 text-[24px] tracking-[-0.72px]" data-node-id="I511:29637;407:13285">
                Crypto spread
              </p>
              <div className="content-stretch flex font-['TWK_Everett:Bold'] items-center justify-center relative shrink-0" data-node-id="I511:29637;407:13290">
                <p className="relative shrink-0 text-[40px]" data-node-id="I511:29637;407:13286">{`< 1.0`}</p>
                <p className="relative shrink-0 text-[20px] tracking-[-0.6px]" data-node-id="I511:29637;407:13288">
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[80px] items-start left-[79px] not-italic top-[229px] w-[751px]" data-node-id="511:29641">
          <div className="content-stretch flex flex-col gap-[11px] items-start relative shrink-0 w-[733px]" data-node-id="511:29642">
            <p className="font-['Cns_Manrope:Bold'] leading-[1.15] relative shrink-0 text-[#545454] text-[28px] tracking-[-0.84px] w-full" data-node-id="511:29643">
              Products and Pricing
            </p>
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="511:29644">
              <p className="font-['Cns_Manrope:Bold'] leading-[1.15] relative shrink-0 text-[60px] text-black tracking-[-1.8px] w-full" data-node-id="511:29645">
                QRPh and WebPay
              </p>
              <p className="font-['Cns_Manrope:Regular'] leading-[1.4] relative shrink-0 text-[40px] text-black tracking-[-1.2px] w-full" data-node-id="511:29646">
                Accept every payment in the Philippines
              </p>
              <p className="font-['Cns_Manrope:Medium'] leading-[1.4] relative shrink-0 text-[#606060] text-[28px] tracking-[-0.42px] w-full" data-node-id="511:29647">
                Online. In-store. In crypto. One integration.
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 text-black w-full" data-node-id="511:29648">
            <p className="font-['Cns_Manrope:Bold'] leading-[1.4] relative shrink-0 text-[36px] tracking-[-1.08px] w-full" data-node-id="511:29649">
              Who is it for
            </p>
            <p className="font-['Cns_Manrope:Regular'] leading-[1.6] relative shrink-0 text-[40px] tracking-[-1.2px] w-full" data-node-id="511:29650">
              Online merchants, in-store merchants, and aggregators accepting payments from any Philippine wallet, bank, or crypto holder.
            </p>
          </div>
        </div>
      </div>
      <AccentColor className="absolute h-[11px] left-0 top-[1069px] w-[1920px]" />
    </div>
  );
}
