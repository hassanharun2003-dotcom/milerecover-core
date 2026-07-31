#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(PrototypeBridgeModule, RCTEventEmitter)

RCT_EXTERN_METHOD(getBridgeApiVersion:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getContractVersion:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(fetchPendingEvents:(nonnull NSNumber *)batchSize resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(acknowledgeEvents:(NSArray<NSString *> *)eventIds resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(clearPrototypeData:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
