// get_design_context reference code — Figma PhmKTV0Z0gwAKs8MNxEgcI node 511:29652 (slide 13, product-flow)
// Saved verbatim. Asset URLs are temporary (7 days); local copies in public/figma/shared-product/.
//   imgVector2 -> /figma/shared-product/flow-chevron-arrow.svg
//   imgGroup54416 -> logo (shared chrome, handled elsewhere)
const imgVector2 = "https://www.figma.com/api/mcp/asset/4cc891e8-b0eb-4414-83ee-895c74a285ef.svg";
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/0cd93681-2052-4159-ac43-e6b5c03e0665.svg";

function AccentColor({ className }: { className?: string }) {
  return (
    <div className={className || "h-[11px] relative w-[1920px]"} data-node-id="511:26109" data-name="Accent color">
      <div className="absolute bg-[var(--core\/blue,#1f7aff)] inset-0" data-node-id="510:26092" />
      <div className="absolute bg-[var(--base\/blue\/blue-800,#204680)] inset-[0_1.25%_0_24.17%]" data-node-id="511:26110" />
      <div className="absolute bg-[var(--base\/orange\/orange-500,#fa7312)] inset-[0_4.43%_0_45.16%]" data-node-id="510:26091" />
    </div>
  );
}

function Vector2({ className }: { className?: string }) {
  return (
    <div className={className || "h-[48px] relative w-[28px]"} data-node-id="409:13479">
      <div className="absolute inset-[-4.17%_-9.3%_-4.17%_0]">
        <img alt="" className="block max-w-none size-full" src={imgVector2} />
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

export default function Component13() {
  return (
    <div className="relative size-full" data-node-id="511:29652" data-name="13">
      <div className="absolute h-[1080px] left-0 overflow-clip top-0 w-[1920px]" data-node-id="511:29653" style={{ backgroundImage: "linear-gradient(139.0856182740788deg, rgb(240, 240, 240) 30.321%, rgb(238, 240, 238) 87.755%)" }} data-name="12">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[52.341px] left-[calc(50%-769.78px)] top-[calc(50%-388.83px)] w-[222.45px]" data-node-id="511:29654" data-name="Icon/Logo">
          <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:29654;738:2734">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
          </div>
        </div>
        <div className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex gap-[24px] items-start leading-[1.4] left-1/2 not-italic text-[48px] text-black top-[282px] tracking-[-1.44px] whitespace-nowrap" data-node-id="511:29655">
          <p className="font-['Cns_Manrope:Bold'] relative shrink-0" data-node-id="511:29656">
            QRPh and WebPay
          </p>
          <p className="font-['Cns_Manrope:Regular'] relative shrink-0" data-node-id="511:29657">
            Product Flow
          </p>
        </div>
        <StrictlyPrivateAndConfidential className="absolute h-[33px] left-[79px] top-[938px] w-[426px]" />
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:Bold'] leading-[1.15] left-[819px] not-italic text-[#757575] text-[28px] top-[239px] tracking-[-0.84px] whitespace-nowrap" data-node-id="511:29659">
          Products and Pricing
        </p>
        <div className="-translate-x-1/2 absolute content-stretch flex gap-[16px] items-center justify-center left-1/2 top-[422px] w-[1920px]" data-node-id="511:29660">
          <div className="flex flex-row items-center self-stretch" data-node-id="511:29661">
            <div className="[word-break:break-word] border border-black border-solid content-stretch flex flex-col gap-[36px] h-full items-start not-italic pb-[30px] pt-[60px] px-[30px] relative rounded-[8px] shrink-0 w-[300px]" style={{ backgroundImage: "linear-gradient(138.75190879030154deg, rgb(255, 255, 255) 50%, rgb(251, 251, 251) 94.311%)" }}>
              <p className="-translate-x-full absolute font-['TWK_Everett:Medium'] leading-[1.4] left-[281px] text-[#efa023] text-[24px] text-right top-[7px] tracking-[-0.24px] whitespace-nowrap" data-node-id="I511:29661;409:13454">
                01
              </p>
              <div className="font-['Cns_Manrope:Medium'] leading-[0] min-w-full relative shrink-0 text-[32px] text-black tracking-[-0.8px] w-[min-content]" data-node-id="I511:29661;409:13452">
                <p className="leading-[1.4] mb-0">Your customer</p>
                <p className="leading-[1.4]">is ready to buy</p>
              </div>
              <p className="font-['Cns_Manrope:Medium'] leading-[1.4] min-w-full relative shrink-0 text-[#757575] text-[20px] tracking-[-0.2px] w-[min-content]" data-node-id="I511:29661;409:13453">{`Cart's full, checkout time.`}</p>
            </div>
          </div>
          <Vector2 className="h-[48px] relative shrink-0 w-[28px]" />
          <div className="flex flex-row items-center self-stretch" data-node-id="511:29663">
            <div className="[word-break:break-word] border border-black border-solid content-stretch flex flex-col gap-[36px] h-full items-start not-italic pb-[30px] pt-[60px] px-[30px] relative rounded-[8px] shrink-0 w-[300px]" style={{ backgroundImage: "linear-gradient(138.75190879030154deg, rgb(255, 255, 255) 50%, rgb(251, 251, 251) 94.311%)" }}>
              <p className="-translate-x-full absolute font-['TWK_Everett:Medium'] leading-[1.4] left-[281px] text-[#efa023] text-[24px] text-right top-[7px] tracking-[-0.24px] whitespace-nowrap" data-node-id="I511:29663;409:13454">
                02
              </p>
              <p className="font-['Cns_Manrope:Medium'] leading-[1.4] min-w-full relative shrink-0 text-[32px] text-black tracking-[-0.8px] w-[min-content]" data-node-id="I511:29663;409:13452">
                They choose how to pay
              </p>
              <div className="font-['Cns_Manrope:Medium'] leading-[0] min-w-full relative shrink-0 text-[#757575] text-[20px] tracking-[-0.2px] w-[min-content] whitespace-pre-wrap" data-node-id="I511:29663;409:13453">
                <p className="leading-[1.4] mb-0">{`Any wallet, bank, `}</p>
                <p className="leading-[1.4]">or crypto app.</p>
              </div>
            </div>
          </div>
          <Vector2 className="h-[48px] relative shrink-0 w-[28px]" />
          <div className="flex flex-row items-center self-stretch" data-node-id="511:29665">
            <div className="[word-break:break-word] border border-black border-solid content-stretch flex flex-col gap-[36px] h-full items-start not-italic pb-[30px] pt-[60px] px-[30px] relative rounded-[8px] shrink-0 w-[300px]" style={{ backgroundImage: "linear-gradient(138.75190879030154deg, rgb(255, 255, 255) 50%, rgb(251, 251, 251) 94.311%)" }}>
              <p className="-translate-x-full absolute font-['TWK_Everett:Medium'] leading-[1.4] left-[281px] text-[#efa023] text-[24px] text-right top-[7px] tracking-[-0.24px] whitespace-nowrap" data-node-id="I511:29665;409:13454">
                03
              </p>
              <div className="font-['Cns_Manrope:Medium'] leading-[0] min-w-full relative shrink-0 text-[32px] text-black tracking-[-0.8px] w-[min-content]" data-node-id="I511:29665;409:13452">
                <p className="leading-[1.4] mb-0">They tap</p>
                <p className="leading-[1.4]">or scan</p>
              </div>
              <div className="font-['Cns_Manrope:Medium'] leading-[0] min-w-full relative shrink-0 text-[#757575] text-[20px] tracking-[-0.2px] w-[min-content]" data-node-id="I511:29665;409:13453">
                <p className="leading-[1.4] mb-0">Select from</p>
                <p className="leading-[1.4]">multiple payment.</p>
              </div>
            </div>
          </div>
          <Vector2 className="h-[48px] relative shrink-0 w-[28px]" />
          <div className="flex flex-row items-center self-stretch" data-node-id="511:29667">
            <div className="[word-break:break-word] border border-black border-solid content-stretch flex flex-col gap-[36px] h-full items-start not-italic pb-[30px] pt-[60px] px-[30px] relative rounded-[8px] shrink-0 w-[300px]" style={{ backgroundImage: "linear-gradient(138.75190879030154deg, rgb(255, 255, 255) 50%, rgb(251, 251, 251) 94.311%)" }}>
              <p className="-translate-x-full absolute font-['TWK_Everett:Medium'] leading-[1.4] left-[281px] text-[#efa023] text-[24px] text-right top-[7px] tracking-[-0.24px] whitespace-nowrap" data-node-id="I511:29667;409:13454">
                04
              </p>
              <p className="font-['Cns_Manrope:Medium'] leading-[1.4] min-w-full relative shrink-0 text-[32px] text-black tracking-[-0.8px] w-[min-content]" data-node-id="I511:29667;409:13452">
                The payment clears
              </p>
              <div className="font-['Cns_Manrope:Medium'] leading-[0] min-w-full relative shrink-0 text-[#757575] text-[20px] tracking-[-0.2px] w-[min-content] whitespace-pre-wrap" data-node-id="I511:29667;409:13453">
                <p className="leading-[1.4] mb-0">{`We confirm it `}</p>
                <p className="leading-[1.4]">{`the second it's done.`}</p>
              </div>
            </div>
          </div>
          <Vector2 className="h-[48px] relative shrink-0 w-[28px]" />
          <div className="flex flex-row items-center self-stretch" data-node-id="511:29669">
            <div className="[word-break:break-word] border border-black border-solid content-stretch flex flex-col gap-[36px] h-full items-start leading-[1.4] not-italic pb-[30px] pt-[60px] px-[30px] relative rounded-[8px] shrink-0 w-[300px]" style={{ backgroundImage: "linear-gradient(138.75190879030154deg, rgb(255, 255, 255) 50%, rgb(251, 251, 251) 94.311%)" }}>
              <p className="-translate-x-full absolute font-['TWK_Everett:Medium'] left-[281px] text-[#efa023] text-[24px] text-right top-[7px] tracking-[-0.24px] whitespace-nowrap" data-node-id="I511:29669;409:13454">
                05
              </p>
              <p className="font-['Cns_Manrope:Bold'] min-w-full relative shrink-0 text-[32px] text-black tracking-[-0.8px] w-[min-content]" data-node-id="I511:29669;409:13452">
                You get the money
              </p>
              <p className="font-['Cns_Manrope:Medium'] min-w-full relative shrink-0 text-[#757575] text-[20px] tracking-[-0.2px] w-[min-content] whitespace-pre-wrap" data-node-id="I511:29669;409:13453">{`Straight into your Coins account,  T+0 Settlement.`}</p>
            </div>
          </div>
        </div>
      </div>
      <AccentColor className="absolute h-[11px] left-0 top-[1069px] w-[1920px]" />
    </div>
  );
}
