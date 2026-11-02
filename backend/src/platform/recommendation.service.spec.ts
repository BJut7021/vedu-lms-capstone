import { jest } from '@jest/globals';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

describe('Experiment recovery', () => {
  const id='00000000-0000-4000-8000-000000000001';
  function fixture() {
    const query=jest.fn<any>().mockResolvedValue([]);
    query.mockResolvedValueOnce([{experiment_id:id}]);
    const service=new RecommendationService({query} as any,{} as any);
    return {query,service,internal:service as any};
  }
  it('marks a confirmed missing worker job FAILED', async () => {
    const {query,service,internal}=fixture();
    internal.worker=jest.fn<any>().mockRejectedValue(new NotFoundException());
    await service.onModuleInit();
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toContain("status='RUNNING'");
    expect(JSON.parse(query.mock.calls[1][1][1]).error).toContain('not found');
  });
  it('does not fail a job when worker is unavailable', async () => {
    const {query,service,internal}=fixture();
    internal.worker=jest.fn<any>().mockRejectedValue(new ServiceUnavailableException());
    await service.onModuleInit();
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('does not fail a job still running in the worker', async () => {
    const {query,service,internal}=fixture();
    internal.worker=jest.fn<any>().mockResolvedValue({status:'RUNNING'});
    await service.onModuleInit();
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('persists a completed job through the existing transaction', async () => {
    const {service,internal}=fixture();
    internal.worker=jest.fn<any>().mockResolvedValue({status:'SUCCEEDED',report:{metrics:{}}});
    internal.persist=jest.fn<any>().mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(internal.persist).toHaveBeenCalledWith(id,{metrics:{}});
  });
});
