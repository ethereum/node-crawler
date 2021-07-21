import { forwardRef, HTMLChakraProps, Icon } from "@chakra-ui/react";

export interface LogoProps extends HTMLChakraProps<"svg"> {
}

export const Logo = forwardRef<LogoProps, "svg">(
  (props: LogoProps, ref: React.ForwardedRef<any>) => {
    let w = props.w
    let h = props.h

    if (w && !h) w = h
    if (h && !w) h = w
    if (h && w) h = w

    return (
      <Icon w={w} h={h} viewBox="0 0 100 100" {...props} ref={ref}>
        <path d="M50.3386 5L22 50.8544L50.3386 37.8956V5Z" fill="#EECBC1" stroke="#5D65CD" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M78.6772 50.8544L50.3386 5V37.8956L78.6772 50.8544Z" fill="#B8FAF6" stroke="#5D65CD" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M78.6772 50.8545L50.3386 67.6583V37.8956L78.6772 50.8545Z" fill="#C8B1F4" stroke="#5D65CD" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M50.3386 72.9272V95L78.6772 56.1234L50.3386 72.9272Z" fill="#C8B1F4" stroke="#5D65CD" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M50.3386 72.9272L22 56.1234L50.3386 95V72.9272Z" fill="#EECBC1" stroke="#5D65CD" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M50.3386 67.6583L22 50.8545L50.3386 37.8956V67.6583Z" fill="#88AAF1" stroke="#5D65CD" strokeLinecap="round" strokeLinejoin="round"/>
      </Icon>
    )
  }
)