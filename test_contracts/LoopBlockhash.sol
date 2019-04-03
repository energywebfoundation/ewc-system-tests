pragma solidity ^0.5.4;

contract LoopBlockhash {

    constructor() public {
         
        for(uint i=0; i<1835355;i++)
        {
          assembly{
             pop(blockhash(i))
          }            
        }
        
    }
}
